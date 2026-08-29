# Maruti Suzuki MCP Server

An MCP (Model Context Protocol) server that exposes the showroom API — test drives,
customers, orders, coupons, feedback — as tools any MCP client can call. It's a thin
wrapper: every tool just calls the same REST endpoints (`server/`) that the dashboard
and captive portal already use, so it works against your local dev server or your
deployed Render URL with no other setup.

## What it can do

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

## 1. Install

```bash
cd mcp-server
npm install
```

## 2. Point it at your API

By default it talks to `http://localhost:8000` (your local `server/` dev instance).
To point it at a deployed backend instead, set `MARUTI_API_URL`:

```bash
export MARUTI_API_URL=https://your-deployed-api.onrender.com
```

## 3. Connect it to an MCP client

### Claude Desktop / Claude Code

Add this to your MCP config (`claude_desktop_config.json`, or via `claude mcp add`
for Claude Code):

```json
{
  "mcpServers": {
    "maruti-suzuki": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-server/index.js"],
      "env": {
        "MARUTI_API_URL": "http://localhost:8000"
      }
    }
  }
}
```

Restart Claude Desktop (or your Claude Code session) and you'll be able to ask things
like:

> "List today's test drive bookings that are still awaiting confirmation"
> "Confirm the test drive for Chaitanya A"
> "What coupons are currently active?"

### Any other MCP client

It's a standard stdio MCP server — run `node index.js` (with `MARUTI_API_URL` set in
the environment) and point your client's stdio transport at that command. No HTTP
server of its own to run or port to open.

## Notes

- This server has no auth of its own — it inherits whatever the underlying API allows.
  If you lock down `server/` behind auth later, this wrapper will need matching
  credentials added to `apiRequest()` in `index.js`.
- `update_test_drive_status` and the other write tools call the same endpoints the
  dashboard uses, so changes made here show up in the dashboard on its next 10-second
  poll, and persist through Supabase the same way (see the root `README.md`'s
  "Database setup" section if you haven't configured that yet).
