import { Router } from "express";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { createTools } from "../../../mcp-server/tools.js";

const router = Router();

// This route serves the exact same tools as the local stdio server in
// mcp-server/index.js — same definitions, imported from the shared
// mcp-server/tools.js so the two never drift apart. The only difference is
// transport: this one is reachable over HTTPS, which is what claude.ai's
// "Add custom connector" and ChatGPT's "Add custom connector" (Developer
// mode) both require — neither can reach a local stdio process.
//
// Since Claude/ChatGPT connect from Anthropic's/OpenAI's cloud rather than
// your machine, MARUTI_API_URL here should almost always be left unset so it
// defaults to this same server (self-referential — the MCP tools call this
// process's own /api/* routes over HTTP).
const API_BASE_URL = process.env.MARUTI_API_URL || `http://localhost:${process.env.PORT || 8000}`;
const TOOLS = createTools(API_BASE_URL);
const toolsByName = new Map(TOOLS.map((t) => [t.name, t]));

// Optional shared-secret protection. Unset by default (open connector — fine
// for testing). To require a token, set MCP_AUTH_TOKEN and then either:
//   - add an "Authorization: Bearer <token>" header (if your client's
//     connector UI supports custom headers), or
//   - append ?token=<token> to the URL you paste into the connector field
//     (works with any client, since it's just part of the URL).
const MCP_AUTH_TOKEN = process.env.MCP_AUTH_TOKEN || null;

function isAuthorized(req) {
  if (!MCP_AUTH_TOKEN) return true;
  const authHeader = req.headers.authorization || "";
  const bearerMatch = authHeader === `Bearer ${MCP_AUTH_TOKEN}`;
  const queryMatch = req.query.token === MCP_AUTH_TOKEN;
  return bearerMatch || queryMatch;
}

function buildServer() {
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

  return server;
}

// Stateless mode: a new Server + transport per request. Simpler and more
// robust than session-based streaming for a small tool server like this one,
// and avoids needing sticky sessions if this ever runs behind a load
// balancer or scales to multiple instances.
router.post("/mcp", async (req, res) => {
  if (!isAuthorized(req)) {
    return res.status(401).json({
      jsonrpc: "2.0",
      error: { code: -32001, message: "Unauthorized" },
      id: null,
    });
  }

  try {
    const server = buildServer();
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    res.on("close", () => {
      transport.close();
      server.close();
    });
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (err) {
    console.error("MCP request error:", err);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: { code: -32603, message: "Internal server error" },
        id: null,
      });
    }
  }
});

// This server doesn't keep sessions open, so it has nothing to stream back
// on a bare GET and nothing to tear down on DELETE — both are effectively
// "not supported" for a stateless server like this one.
router.get("/mcp", (req, res) => {
  res.status(405).json({
    jsonrpc: "2.0",
    error: { code: -32000, message: "Method not allowed — this is a stateless MCP server." },
    id: null,
  });
});

router.delete("/mcp", (req, res) => {
  res.status(405).end();
});

export default router;
