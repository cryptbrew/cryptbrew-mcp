#!/usr/bin/env node
import { pathToFileURL } from "node:url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  ABOUT,
  CONTACT,
  HOW_IT_WORKS,
  LINKS,
  LOCK_INFO,
  PRICING,
  formatFaqAnswer,
} from "./content.js";
import { checkAllHealth, formatHealthReport } from "./health.js";

const SERVER_NAME = "cryptbrew-mcp";
const SERVER_VERSION = "1.0.0";

function textResult(text: string) {
  return { content: [{ type: "text" as const, text }] };
}

export function createServer(): McpServer {
  const server = new McpServer({
    name: SERVER_NAME,
    version: SERVER_VERSION,
  });

  server.registerTool(
    "cryptbrew_about",
    {
      description:
        "Overview of Cryptbrew: business Bitcoin invoicing and tax-ready payment tracking for SMBs.",
    },
    async () => textResult(ABOUT),
  );

  server.registerTool(
    "cryptbrew_pricing",
    {
      description:
        "Cryptbrew fees and pricing: payment fee (1% min 10 sats), free iOS app, CryptBrew Lock price.",
    },
    async () => textResult(PRICING),
  );

  server.registerTool(
    "cryptbrew_links",
    {
      description:
        "Official Cryptbrew URLs: website, help, support, Lock, downloads, llms.txt, API, App Store, health.",
    },
    async () => textResult(LINKS),
  );

  server.registerTool(
    "cryptbrew_how_it_works",
    {
      description:
        "Explain how Cryptbrew invoicing, payment forwarding, and non-custody model work.",
    },
    async () => textResult(HOW_IT_WORKS),
  );

  server.registerTool(
    "cryptbrew_lock_info",
    {
      description:
        "CryptBrew Lock details: Mac lock screen, Touch ID, failed-auth photo+email, Homebrew, pricing.",
    },
    async () => textResult(LOCK_INFO),
  );

  server.registerTool(
    "cryptbrew_faq",
    {
      description:
        "Answer a Cryptbrew product question using the built-in FAQ knowledge base.",
      inputSchema: {
        question: z
          .string()
          .describe("Natural-language product question about Cryptbrew"),
      },
    },
    async ({ question }) => textResult(formatFaqAnswer(question)),
  );

  server.registerTool(
    "cryptbrew_health",
    {
      description:
        "Fetch live Cryptbrew API health from /payments/health and /health.",
    },
    async () => {
      const results = await checkAllHealth();
      return textResult(formatHealthReport(results));
    },
  );

  server.registerTool(
    "cryptbrew_contact",
    {
      description:
        "Cryptbrew support and contact channels: email, WhatsApp, setup visits, help pages.",
    },
    async () => textResult(CONTACT),
  );

  return server;
}

async function main(): Promise<void> {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`${SERVER_NAME} v${SERVER_VERSION} running on stdio`);
}

const isDirectRun =
  typeof process.argv[1] === "string" &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  main().catch((err) => {
    console.error("Fatal:", err);
    process.exit(1);
  });
}
