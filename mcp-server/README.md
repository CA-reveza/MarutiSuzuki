# Maruti Suzuki MCP Server

Exposes the showroom API — test drives, customers, orders, coupons, feedback — as MCP
tools. There are two ways to use it, depending on the client:

| Client | Transport | Where it lives |
|---|---|---|
| Claude Desktop, Claude Code (local config) | stdio | `mcp-server/index.js` — runs as a local process |
| **claude.ai, ChatGPT (Connectors), Claude Cowork, mobile apps** | Streamable HTTP | `/mcp` on your deployed `server/` — a public URL |

**If you want this as a Connector in claude.ai or ChatGPT, you need the second one.**
Both of those run in the cloud, not on your machine — they can only reach a public
HTTPS URL, not a local command. The good news: the HTTP version is already mounted on
the same backend you deployed to Render (see the root `README.md`), so if that's live,
you already have a URL — `https://your-app.onrender.com/mcp`.

## Tools (same set on both transports)

| Tool | What it does |
|---|---|
| `list_test_drives` | List test drive bookings, optionally filtered by status |
| `book_test_drive` | Create a new test drive booking |
| `update_test_drive_status` | Confirm / mark completed / cancel a booking |
| `list_customers` | List captive-portal customers |
| `list_orders` | List orders |
| `place_order` | Record a new order |
| `list_coupons` | List promotional coupons |
| `create_coupon` | Create a new coupon |
| `list_feedback` | List customer feedback |
| `get_store_info` | Showroom info + active offers |

---

## Option A — Remote connector (claude.ai / ChatGPT)

### 1. Deploy (if you haven't already)

The `/mcp` endpoint ships as part of `server/`, so deploying the backend (see the root
`README.md` → "Deploy the backend to Render") gives you the MCP endpoint automatically
at `https://your-app.onrender.com/mcp` — nothing extra to build or host.

Locally, it's at `http://localhost:8000/mcp` — but that only works for testing with
tools that run on your own machine (like `npx @modelcontextprotocol/inspector`).
claude.ai and ChatGPT run in the cloud and can't reach `localhost`, so you'll need the
deployed URL for those.

### 2. (Recommended) Add a shared-secret token

By default the endpoint has no auth — fine for a quick test, not fine for something
with write access to your customer/order data sitting on the open internet. Set an env
var on your Render service (Render dashboard → your service → Environment):

```
MCP_AUTH_TOKEN=some-long-random-string
```

Then use `https://your-app.onrender.com/mcp?token=some-long-random-string` as the URL
you paste into the connector (the token also works as an `Authorization: Bearer
<token>` header if your client's UI supports custom headers — the query-param version
is the one guaranteed to work everywhere, since it's just part of the URL).

### 3. Add it in claude.ai

1. Go to **Customize → Connectors**
2. Click **+**, then **Add custom connector**
3. Paste your URL (with `?token=...` if you set one)
4. Click **Add**

(Free plan: limited to one custom connector. Pro/Max/Team/Enterprise: no limit.)

### 4. Add it in ChatGPT

1. **Settings → Apps → Advanced settings** (this has moved before — if you don't see
   it, check **Settings → Connectors → Advanced** instead)
2. Toggle **Developer mode** on (requires Plus/Pro/Business/Enterprise/Edu — on
   Business/Enterprise workspaces, an admin may need to enable "Create custom MCP
   connectors" first under Workspace Settings → Permissions & Roles)
3. **Settings → Connectors → Create** (or **Add custom connector**)
4. Enter a name (e.g. "Maruti Suzuki"), a description, and your URL under
   **Connection** — make sure the `/mcp` path is included
5. Create the connection, then review the tools it discovered

Note: if you change the tool list later (edit `mcp-server/tools.js` and redeploy),
ChatGPT's metadata snapshot won't auto-update — reopen the connection and hit
**Refresh**.

---

## Option B — Local stdio (Claude Desktop / Claude Code)

### 1. Install

```bash
cd mcp-server
npm install
```

### 2. Point it at your API

```bash
export MARUTI_API_URL=http://localhost:8000   # or your deployed Render URL
```

### 3. Add to your MCP config

```json
{
  "mcpServers": {
    "maruti-suzuki": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-server/index.js"],
      "env": { "MARUTI_API_URL": "http://localhost:8000" }
    }
  }
}
```

Restart Claude Desktop (or your Claude Code session), then try:

> "List today's test drive bookings that are still awaiting confirmation"
> "Confirm the test drive for Chaitanya A"
> "What coupons are currently active?"

---

## Notes

- Both transports share one tool list (`mcp-server/tools.js`) — editing a tool there
  updates it everywhere. No need to keep two copies in sync.
- The HTTP route (`server/src/routes/mcp.js`) runs in **stateless mode** — a fresh
  Server + transport per request, no session state kept between calls. Simple and
  robust for a small tool server like this; it also means it doesn't support
  server-initiated streaming (a bare `GET /mcp` correctly returns "not supported").
- Write tools (`update_test_drive_status`, `place_order`, `create_coupon`, etc.) call
  the same endpoints the dashboard uses, so changes show up there on its next
  10-second poll and persist through Supabase the same way — see the root `README.md`
  "Database setup" section if that isn't configured yet.
