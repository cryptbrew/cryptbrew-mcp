# cryptbrew-mcp

Public [Model Context Protocol](https://modelcontextprotocol.io/) server so AI agents can answer **Cryptbrew** product questions and check **live API health**. No merchant authentication in v1.

Cryptbrew is business Bitcoin invoicing and tax-ready payment tracking for SMBs.

## Tools

| Tool | Description |
|------|-------------|
| `cryptbrew_about` | Product overview |
| `cryptbrew_pricing` | Invoicing fees only (1% / free iOS) — not Lock |
| `cryptbrew_links` | Official URLs |
| `cryptbrew_how_it_works` | Invoice / payment / forwarding flow |
| `cryptbrew_lock_info` | CryptBrew Lock only (separate Mac app) |
| `cryptbrew_faq` | FAQ lookup (`question` argument) |
| `cryptbrew_health` | Live GET health probes |
| `cryptbrew_contact` | Support and contact channels |

## Requirements

- Node.js 18+

## Install & run

```bash
git clone https://github.com/cryptbrew/cryptbrew-mcp.git
cd cryptbrew-mcp
npm install
npm run build
npm start
```

The server speaks MCP over **stdio** (stdout is reserved for protocol messages; logs go to stderr).

## Remote HTTP (Streamable)

Hosted at **https://mcp.cryptbrew.com/mcp** (health: `GET /` or `/health`).

```bash
npm run start:http   # listens on PORT (default 3040), path /mcp
```

Cursor remote MCP example:

```json
{
  "mcpServers": {
    "cryptbrew": {
      "url": "https://mcp.cryptbrew.com/mcp"
    }
  }
}
```

Or locally:

```json
{
  "mcpServers": {
    "cryptbrew-local-http": {
      "url": "http://127.0.0.1:3040/mcp"
    }
  }
}
```


```bash
npm test
```

## Cursor (`mcp.json`)

Add to your Cursor MCP config (e.g. `~/.cursor/mcp.json` or project `.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "cryptbrew": {
      "command": "node",
      "args": ["/absolute/path/to/cryptbrew-mcp/dist/index.js"]
    }
  }
}
```

Or after `npm link` / global install of the `cryptbrew-mcp` binary:

```json
{
  "mcpServers": {
    "cryptbrew": {
      "command": "cryptbrew-mcp"
    }
  }
}
```

Or with `npx` once published:

```json
{
  "mcpServers": {
    "cryptbrew": {
      "command": "npx",
      "args": ["-y", "cryptbrew-mcp"]
    }
  }
}
```

## Claude Desktop

Edit Claude Desktop config (`claude_desktop_config.json`):

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "cryptbrew": {
      "command": "node",
      "args": ["/absolute/path/to/cryptbrew-mcp/dist/index.js"]
    }
  }
}
```

Restart Claude Desktop after saving.

## Product facts (v1 knowledge)

- Fee: **1%** minimum **10 sats**; iOS app **free**
- Auto-forward to merchant Lightning/on-chain wallet; **no merchant private keys stored**; not long-term custody
- **CryptBrew Lock (separate product):** Mac lock screen — use `cryptbrew_lock_info` (do not mix with the 1% invoicing fee)
- Site: [www.cryptbrew.com](https://www.cryptbrew.com) · [help](https://www.cryptbrew.com/help.html) · [support](https://www.cryptbrew.com/support.html) · [lock](https://www.cryptbrew.com/lock/) · [downloads](https://www.cryptbrew.com/downloads/) · [llms.txt](https://www.cryptbrew.com/llms.txt)
- API: [redoc](https://api.cryptbrew.com/redoc) · health: `/payments/health` and `/health`
- App Store id `6776077464` · support@cryptbrew.com · WhatsApp (707) 387-4140 · hello@cryptbrew.com for setup visits

## License

MIT
