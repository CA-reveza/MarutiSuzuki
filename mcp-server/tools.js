// Tool definitions shared by both MCP transports:
//   - index.js         (stdio — for local Claude Desktop / Claude Code config)
//   - ../server/src/routes/mcp.js  (Streamable HTTP — for remote Connectors)
//
// Every tool just calls the existing REST API (server/) — no direct database
// access. createTools(apiBaseUrl) binds that base URL so the same tool list
// can point at localhost in one context and a deployed Render URL in another.

export function createTools(apiBaseUrl) {
  const baseUrl = apiBaseUrl.replace(/\/$/, "");

  async function apiRequest(method, path, body) {
    const res = await fetch(`${baseUrl}${path}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    const text = await res.text();
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { raw: text };
    }

    if (!res.ok) {
      throw new Error(
        `${method} ${path} failed (${res.status}): ${data.error || data.raw || res.statusText}`
      );
    }
    return data;
  }

  return [
    {
      name: "list_test_drives",
      description:
        "List test drive bookings made via the captive portal's 'Pre-book a Test Drive' flow. " +
        "Optionally filter by status.",
      inputSchema: {
        type: "object",
        properties: {
          status: {
            type: "string",
            enum: ["Requested", "Confirmed", "Completed", "Cancelled"],
            description: "Only return bookings with this status. Omit to return all.",
          },
        },
      },
      handler: async (args) => {
        const data = await apiRequest("GET", "/api/testdrives");
        let testDrives = data.testDrives || [];
        if (args?.status) {
          testDrives = testDrives.filter((t) => t.status === args.status);
        }
        return testDrives;
      },
    },
    {
      name: "book_test_drive",
      description:
        "Create a new test drive booking, as if a customer submitted the 'Pre-book a Test Drive' " +
        "form on the captive portal.",
      inputSchema: {
        type: "object",
        properties: {
          customerName: { type: "string", description: "Customer's full name" },
          customerPhone: { type: "string", description: "Customer's phone number" },
          customerEmail: { type: "string", description: "Customer's email (optional)" },
          model: {
            type: "string",
            description: "Vehicle model, e.g. SWIFT, BALENO, BREZZA, GRAND VITARA, DZIRE, ERTIGA, JIMNY, EECO",
          },
          date: { type: "string", description: "Preferred date, YYYY-MM-DD (defaults to today)" },
          slot: { type: "string", description: "Preferred time slot, e.g. '11:30 AM' (optional)" },
          storeLocation: { type: "string", description: "Showroom location (optional, defaults to the flagship store)" },
        },
        required: ["customerName", "customerPhone", "model"],
      },
      handler: async (args) => {
        const data = await apiRequest("POST", "/api/testdrives", args);
        return data.testDrive;
      },
    },
    {
      name: "update_test_drive_status",
      description:
        "Update a test drive booking's status — e.g. confirm a request, mark one completed after " +
        "the customer visits, or cancel it. Persists to the database so it survives a dashboard refresh.",
      inputSchema: {
        type: "object",
        properties: {
          id: { type: "string", description: "The test drive booking's id (from list_test_drives)" },
          status: {
            type: "string",
            enum: ["Requested", "Confirmed", "Completed", "Cancelled"],
          },
        },
        required: ["id", "status"],
      },
      handler: async (args) => {
        const data = await apiRequest("PATCH", `/api/testdrives/${encodeURIComponent(args.id)}`, {
          status: args.status,
        });
        return data.testDrive;
      },
    },
    {
      name: "list_customers",
      description: "List customers who have checked in via the captive portal or placed an order.",
      inputSchema: { type: "object", properties: {} },
      handler: async () => {
        const data = await apiRequest("GET", "/api/customers");
        return data.customers || data;
      },
    },
    {
      name: "list_orders",
      description: "List orders (parts, accessories, service, etc.) placed at the showroom.",
      inputSchema: { type: "object", properties: {} },
      handler: async () => {
        const data = await apiRequest("GET", "/api/orders");
        return data.orders || [];
      },
    },
    {
      name: "place_order",
      description: "Record a new order — e.g. a spare parts, accessories, or service purchase.",
      inputSchema: {
        type: "object",
        properties: {
          customerName: { type: "string" },
          customerPhone: { type: "string" },
          customerEmail: { type: "string" },
          items: {
            type: "array",
            description: "Line items in the order",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                price: { type: "number" },
                qty: { type: "number" },
              },
            },
          },
          totalAmount: { type: "number", description: "Order total in ₹ (optional — computed from items if omitted)" },
          couponCode: { type: "string", description: "Coupon code to redeem, if any" },
          storeLocation: { type: "string" },
          channel: { type: "string", description: "e.g. 'Online' or 'In-Store' (optional)" },
        },
        required: ["customerName", "customerPhone", "items"],
      },
      handler: async (args) => {
        const data = await apiRequest("POST", "/api/order", {
          user: { name: args.customerName, phone: args.customerPhone, email: args.customerEmail },
          items: args.items,
          finalTotal: args.totalAmount,
          couponCode: args.couponCode,
          storeLocation: args.storeLocation,
          channel: args.channel,
        });
        return data;
      },
    },
    {
      name: "list_coupons",
      description: "List active/scheduled promotional coupons.",
      inputSchema: { type: "object", properties: {} },
      handler: async () => {
        const data = await apiRequest("GET", "/api/coupons");
        return data.coupons || [];
      },
    },
    {
      name: "create_coupon",
      description: "Create a new promotional coupon.",
      inputSchema: {
        type: "object",
        properties: {
          code: { type: "string", description: "Coupon code, e.g. SERVICE10" },
          title: { type: "string" },
          description: { type: "string" },
          discountType: { type: "string", enum: ["Percentage", "Flat Amount"] },
          discountValue: { type: "number" },
          minOrderValue: { type: "number" },
          maxUsage: { type: "number" },
          startDate: { type: "string", description: "YYYY-MM-DD" },
          endDate: { type: "string", description: "YYYY-MM-DD" },
          applicableCategory: { type: "string" },
        },
        required: ["code"],
      },
      handler: async (args) => {
        const data = await apiRequest("POST", "/api/coupons", args);
        return data.coupon;
      },
    },
    {
      name: "list_feedback",
      description: "List customer feedback submitted through the captive portal.",
      inputSchema: { type: "object", properties: {} },
      handler: async () => {
        const data = await apiRequest("GET", "/api/feedbacks");
        return data.feedbacks || [];
      },
    },
    {
      name: "get_store_info",
      description: "Get showroom info and active offers.",
      inputSchema: {
        type: "object",
        properties: {
          storeId: { type: "string", description: "Store identifier (optional, defaults to 'flagship')" },
        },
      },
      handler: async (args) => {
        const storeId = args?.storeId || "flagship";
        return apiRequest("GET", `/api/menu/${encodeURIComponent(storeId)}`);
      },
    },
  ];
}
