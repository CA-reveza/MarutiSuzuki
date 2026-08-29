#!/usr/bin/env node
// Local (stdio) MCP server for the Maruti Suzuki showroom platform.
//
// Use this for Claude Desktop / Claude Code, which can launch a local
// process directly. For claude.ai, ChatGPT, or any other client that needs
// a remote connector (a public HTTPS URL), use the /mcp endpoint mounted on
// the deployed API server instead — see ../server/src/routes/mcp.js and the
// "Remote connector" section of this folder's README.
//
// This does NOT talk to Supabase or the database directly — it calls the
// same REST endpoints the dashboard and captive portal already use.

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { createTools } from "./tools.js";

const API_BASE_URL = process.env.MARUTI_API_URL || "http://localhost:8000";
const TOOLS = createTools(API_BASE_URL);
const toolsByName = new Map(TOOLS.map((t) => [t.name, t]));

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
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  } catch (err) {
    return { isError: true, content: [{ type: "text", text: `Error: ${err.message}` }] };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);

console.error(`Maruti Suzuki MCP server (stdio) running — talking to ${API_BASE_URL}`);
