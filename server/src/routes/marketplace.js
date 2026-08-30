import { Router } from "express";
import { marketplaceDb, marketplaceReady } from "../marketplaceSupabase.js";

const router = Router();

// ---------------------------------------------------------------------------
// Confirmed schema (re-verified directly against the Axionik-Marketplace
// Supabase project's public schema on 2026-08-30, after the first version of
// this file was found to be stale against the live project). None of these
// tables have declared FK constraints we've confirmed exist, so we do
// explicit two-step lookups (fetch ids, then batch-fetch related rows)
// rather than PostgREST's embedded-resource syntax.
//
// retail_orders: id, user_id, store_id, line_items (jsonb), base_amount,
//                discount_id, discount_amount, final_amount, status, source,
//                source_client, payment_ref, created_at, confirmed_at
// app_users:     id, full_name, phone, email, created_at
// products:      id, store_id, name, description, category, brand,
//                base_price, image_url, is_active, created_at
//
// `line_items` is jsonb, so information_schema can't tell us what's inside
// each element — the field names below (product_id/quantity/size) are a
// best guess carried over from the original integration. pick() below tries
// a couple of likely key-name variants per field so small naming drift
// (e.g. productId vs product_id) doesn't silently blank out every line. If
// order line items still show as "1x Item" instead of a real product name,
// the real key names differ — pull a sample row's `line_items` value and
// update the KEY candidate lists below to match.
//
// There is no `customers` table in this project (it's `app_users`), and no
// `orders` table (it's `retail_orders`) — an earlier version of this file
// assumed both, which is what caused the "could not find the table
// 'public.orders'" / "column orders.customer_id does not exist" errors.
// ---------------------------------------------------------------------------

const RECENT_LIMIT = 100; // cap for the "all customers" activity feed

function pick(obj, keys) {
  for (const k of keys) {
    if (obj && obj[k] !== undefined && obj[k] !== null) return obj[k];
  }
  return undefined;
}

async function getCustomerIdByEmail(email) {
  const { data, error } = await marketplaceDb
    .from("app_users")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  if (error) throw error;
  return data?.id || null;
}

async function lookupById(table, ids, columns) {
  if (!ids.length) return new Map();
  const { data, error } = await marketplaceDb.from(table).select(columns).in("id", [...new Set(ids)]);
  if (error) throw error;
  return new Map((data || []).map((row) => [row.id, row]));
}

async function withMarketplaceReady(fn) {
  if (!marketplaceReady) return { rows: [], error: "Marketplace Supabase not configured" };
  try {
    return { rows: await fn(), error: null };
  } catch (err) {
    return { rows: [], error: err.message };
  }
}

// userId === null means "across all customers" (used by the Connectors tab).
function applyCustomerFilter(query, userId) {
  return userId ? query.eq("user_id", userId) : query.limit(RECENT_LIMIT);
}

// ---------------------------------------------------------------------------
// Retail orders: retail_orders -> app_users + products (via line_items jsonb)
// ---------------------------------------------------------------------------
async function fetchRetailOrders(userId) {
  return withMarketplaceReady(async () => {
    const { data: orders, error } = await applyCustomerFilter(
      marketplaceDb
        .from("retail_orders")
        .select(
          "id, user_id, line_items, base_amount, discount_amount, final_amount, status, source, source_client, payment_ref, created_at, confirmed_at"
        )
        .order("created_at", { ascending: false }),
      userId
    );
    if (error) throw error;
    if (!orders?.length) return [];

    const productIds = orders
      .flatMap((o) => (o.line_items || []).map((li) => pick(li, ["product_id", "productId", "id"])))
      .filter(Boolean);

    const [products, customers] = await Promise.all([
      lookupById("products", productIds, "id, name, brand, base_price"),
      lookupById(
        "app_users",
        orders.map((o) => o.user_id),
        "id, full_name, email"
      ),
    ]);

    return orders.map((o) => {
      const customer = customers.get(o.user_id);
      return {
        id: o.id,
        customer_name: customer?.full_name || "-",
        customer_email: customer?.email || "-",
        store: o.source_client || o.source || "-",
        items: (o.line_items || [])
          .map((li) => {
            const productId = pick(li, ["product_id", "productId", "id"]);
            const product = products.get(productId);
            const label = product ? `${product.brand ? product.brand + " " : ""}${product.name}` : "Item";
            const sizeVal = pick(li, ["size", "variant", "option"]);
            const size = sizeVal ? ` (${sizeVal})` : "";
            const qty = pick(li, ["quantity", "qty"]) || 1;
            return `${qty}x ${label}${size}`;
          })
          .join(", "),
        amount: o.final_amount,
        discount: o.discount_amount,
        status: o.status,
        payment_ref: o.payment_ref || "-",
        created_at: o.created_at,
        confirmed_at: o.confirmed_at,
      };
    });
  });
}

async function buildActivity(userId) {
  const retail = await fetchRetailOrders(userId);
  return [{ key: "retail_orders", label: "Retail Orders", rows: retail.rows, error: retail.error }];
}

function notConfiguredResponse(extra = {}) {
  return {
    success: true,
    marketplace_ready: false,
    activity: [
      { key: "retail_orders", label: "Retail Orders", rows: [], error: "Marketplace Supabase not configured" },
    ],
    ...extra,
  };
}

// ---------------------------------------------------------------------------
// GET /api/marketplace/activity/all -- powers the "Connectors" dashboard tab.
// Shows the most recent retail order activity across ALL Marketplace
// customers, not scoped to a single Maruti Suzuki shopper.
// ---------------------------------------------------------------------------
router.get("/api/marketplace/activity/all", async (req, res) => {
  if (!marketplaceReady) return res.json(notConfiguredResponse());
  const activity = await buildActivity(null);
  res.json({ success: true, marketplace_ready: true, activity });
});

// ---------------------------------------------------------------------------
// GET /api/marketplace/:email -- per-customer lookup, used by the customer
// detail modal in the Customers tab.
// ---------------------------------------------------------------------------
router.get("/api/marketplace/:email", async (req, res) => {
  const email = decodeURIComponent(req.params.email || "").trim().toLowerCase();
  if (!email) return res.status(400).json({ success: false, error: "email is required" });

  if (!marketplaceReady) return res.json(notConfiguredResponse({ email }));

  let userId;
  try {
    userId = await getCustomerIdByEmail(email);
  } catch (err) {
    return res.json({
      success: false,
      marketplace_ready: true,
      email,
      error: `Could not look up customer: ${err.message}`,
      activity: [],
    });
  }

  if (!userId) {
    return res.json({
      success: true,
      marketplace_ready: true,
      email,
      activity: [{ key: "retail_orders", label: "Retail Orders", rows: [], error: null }],
      note: "No Marketplace account found for this email.",
    });
  }

  const activity = await buildActivity(userId);
  res.json({ success: true, marketplace_ready: true, email, activity });
});

export default router;
