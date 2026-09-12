#!/usr/bin/env node
/**
 * Streamable HTTP entry for remote MCP clients (Cursor, etc.).
 * Listens on PORT (default 3040), MCP path /mcp, health at / and /health.
 */
import { createServer as createHttpServer, type IncomingMessage, type ServerResponse } from "node:http";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createServer } from "./index.js";

const SERVER_NAME = "cryptbrew-mcp";
const SERVER_VERSION = "1.0.0";
const PORT = Number(process.env.PORT || 3040);
const HOST = process.env.HOST || "127.0.0.1";
const MCP_PATH = "/mcp";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Accept, Authorization, Mcp-Session-Id, Last-Event-ID, mcp-protocol-version",
  "Access-Control-Expose-Headers": "Mcp-Session-Id",
  "Access-Control-Max-Age": "86400",
};

function applyCors(res: ServerResponse): void {
  for (const [k, v] of Object.entries(CORS_HEADERS)) {
    res.setHeader(k, v);
  }
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  applyCors(res);
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(payload),
  });
  res.end(payload);
}

function healthBody() {
  return {
    ok: true,
    status: "ok",
    service: SERVER_NAME,
    version: SERVER_VERSION,
    transport: "streamable-http",
    mcpPath: MCP_PATH,
  };
}

async function handleMcp(req: IncomingMessage, res: ServerResponse): Promise<void> {
  applyCors(res);

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // Stateless: fresh server + transport per request (public FAQ tools; no session sticky).
  const server = createServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });

  const cleanup = () => {
    void transport.close();
    void server.close();
  };
  res.on("close", cleanup);

  try {
    await server.connect(transport);
    await transport.handleRequest(req, res);
  } catch (err) {
    console.error("MCP request error:", err);
    if (!res.headersSent) {
      sendJson(res, 500, {
        jsonrpc: "2.0",
        error: { code: -32603, message: "Internal server error" },
        id: null,
      });
    }
  }
}

function pathname(req: IncomingMessage): string {
  try {
    return new URL(req.url || "/", `http://${req.headers.host || "localhost"}`).pathname;
  } catch {
    return "/";
  }
}

const httpServer = createHttpServer((req, res) => {
  const path = pathname(req);

  if (req.method === "OPTIONS") {
    applyCors(res);
    res.writeHead(204);
    res.end();
    return;
  }

  if ((path === "/" || path === "/health") && (req.method === "GET" || req.method === "HEAD")) {
    sendJson(res, 200, healthBody());
    return;
  }

  if (path === MCP_PATH) {
    void handleMcp(req, res);
    return;
  }

  sendJson(res, 404, { ok: false, error: "not_found" });
});

httpServer.listen(PORT, HOST, () => {
  console.error(
    `${SERVER_NAME} v${SERVER_VERSION} Streamable HTTP on http://${HOST}:${PORT}${MCP_PATH}`,
  );
});

function shutdown(): void {
  console.error("Shutting down HTTP server…");
  httpServer.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 5000).unref();
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
