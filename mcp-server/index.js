#!/usr/bin/env node
// MCP server for the Maruti Suzuki showroom platform.
//
// This wraps the existing Express API (see ../server) as a set of MCP tools,
// so any MCP client (Claude Desktop, Claude Code, etc.) can list/manage test
// drives, customers, orders, coupons, and feedback in natural language.
//
// It does NOT talk to Supabase or the database directly — it just calls the
// same REST endpoints the dashboard and captive portal already use. Point it
// at your local dev server or your deployed Render URL via MARUTI_API_URL.

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const API_BASE_URL = (process.env.MARUTI_API_URL || "http://localhost:8000").replace(/\/$/, "");

async function apiRequest(method, path, body) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
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

// ---------------------------------------------------------------------------
// Tool definitions
// ---------------------------------------------------------------------------

const TOOLS = [
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

const toolsByName = new Map(TOOLS.map((t) => [t.name, t]));

// ---------------------------------------------------------------------------
// MCP wiring
// ---------------------------------------------------------------------------

const server = new Server(
  { name: "maruti-suzuki-mcp-server", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: TOOLS.map(({ name, description, inputSchema }) => ({ name, description, inputSchema })),
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const tool = toolsByName.get(request.params.name);
  if (!tool) {
    return {
      isError: true,
      content: [{ type: "text", text: `Unknown tool: ${request.params.name}` }],
    };
  }

  try {
    const result = await tool.handler(request.params.arguments || {});
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  } catch (err) {
    return {
      isError: true,
      content: [{ type: "text", text: `Error: ${err.message}` }],
    };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);

console.error(`Maruti Suzuki MCP server running — talking to ${API_BASE_URL}`);
