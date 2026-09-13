import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export interface FaqEntry {
  id: string;
  question: string;
  answer: string;
  keywords: string[];
}

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadFaq(): FaqEntry[] {
  const candidates = [
    join(__dirname, "knowledge", "faq.json"),
    join(__dirname, "..", "knowledge", "faq.json"),
  ];
  for (const path of candidates) {
    try {
      const raw = readFileSync(path, "utf8");
      return JSON.parse(raw) as FaqEntry[];
    } catch {
      // try next
    }
  }
  throw new Error("Could not load knowledge/faq.json");
}

export const faqEntries: FaqEntry[] = loadFaq();

export const ABOUT = `Cryptbrew is business Bitcoin invoicing and tax-ready payment tracking for small and medium businesses (SMBs).

Merchants create invoices and payment links, accept Bitcoin (Lightning and on-chain), and get records suitable for bookkeeping and taxes. Payments auto-forward to the merchant's Lightning or on-chain wallet. Cryptbrew does not store merchant private keys and is not long-term custody.

The free iOS app is on the App Store; on Apple silicon Macs it may also run via the App Store (not Homebrew). Homebrew is only for CryptBrew Lock.

Website: https://www.cryptbrew.com
Help: https://www.cryptbrew.com/help.html
API docs: https://api.cryptbrew.com/redoc`;

export const PRICING = `Cryptbrew (Bitcoin invoicing) payment fee: 1% with a minimum of 10 sats per payment.
iOS app: free (App Store id 6776077464).

Note: CryptBrew Lock is a separate Mac product — use the cryptbrew_lock_info tool for Lock pricing; do not confuse Lock's price with this fee.`;

export const LINKS = `Official Cryptbrew (invoicing) links:
- Website: https://www.cryptbrew.com
- Help: https://www.cryptbrew.com/help.html
- Support: https://www.cryptbrew.com/support.html
- Downloads: https://www.cryptbrew.com/downloads/
- llms.txt: https://www.cryptbrew.com/llms.txt
- API Redoc: https://api.cryptbrew.com/redoc
- Payment link: https://php.cryptbrew.com/payment-link.php
- App Store: https://apps.apple.com/app/id6776077464
- Health (payments): https://api.cryptbrew.com/payments/health
- Health: https://api.cryptbrew.com/health

For CryptBrew Lock (separate Mac app), use cryptbrew_lock_info or https://www.cryptbrew.com/lock/
Homebrew: brew tap cryptbrew/tap && brew install --cask cryptbrew-lock
Tap repo: https://github.com/cryptbrew/homebrew-tap`;

export const HOW_IT_WORKS = `How Cryptbrew works:

1. Merchant configures where Bitcoin should go (Lightning and/or on-chain wallet).
2. Merchant creates an invoice or shares a payment link with the customer.
3. Customer pays in Bitcoin (Lightning or on-chain).
4. Cryptbrew tracks the payment for tax-ready business records.
5. Funds auto-forward to the merchant wallet.

Cryptbrew does not store merchant private keys and is not long-term custody. Fee is 1% (min 10 sats). The iOS app is free.`;

export const LOCK_INFO = `CryptBrew Lock is a separate macOS lock-screen product from Cryptbrew LLC (not the Cryptbrew iOS invoicing app).

Features:
- Mac lock screen
- Touch ID
- Optional failed-auth photo + email alert
- Notarized for macOS
- Apple silicon only (arm64)

Install via Homebrew (Cryptbrew org tap):
  brew tap cryptbrew/tap
  brew install --cask cryptbrew-lock

Tap: https://github.com/cryptbrew/homebrew-tap
Direct download: https://www.cryptbrew.com/downloads/
Product page: https://www.cryptbrew.com/lock/

Price: $9.99 after trial.`;

export const CONTACT = `Contact Cryptbrew:
- Support email: support@cryptbrew.com
- Setup visits: hello@cryptbrew.com
- WhatsApp: (707) 387-4140
- Support page: https://www.cryptbrew.com/support.html
- Help: https://www.cryptbrew.com/help.html
- Website: https://www.cryptbrew.com`;

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s%]/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * Rank FAQ entries against a free-text question. Returns best matches.
 */
export function matchFaq(question: string, limit = 3): FaqEntry[] {
  const q = normalize(question);
  if (!q) {
    return faqEntries.slice(0, limit);
  }
  const tokens = q.split(" ").filter((t) => t.length > 1);

  const scored = faqEntries.map((entry) => {
    const hay = normalize(
      [entry.question, entry.answer, entry.keywords.join(" ")].join(" "),
    );
    let score = 0;
    if (hay.includes(q)) score += 50;
    for (const kw of entry.keywords) {
      const k = normalize(kw);
      if (q.includes(k) || hay.includes(q.split(" ").find((t) => k.includes(t)) ?? "")) {
        if (q.includes(k)) score += 15;
      }
      if (tokens.some((t) => k.includes(t) || t.includes(k))) score += 8;
    }
    for (const t of tokens) {
      if (hay.includes(t)) score += 3;
    }
    return { entry, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const top = scored.filter((s) => s.score > 0).slice(0, limit);
  if (top.length === 0) {
    return faqEntries.slice(0, Math.min(limit, faqEntries.length));
  }
  return top.map((s) => s.entry);
}

export function formatFaqAnswer(question: string): string {
  const matches = matchFaq(question, 3);
  const lines = [
    `Question: ${question.trim() || "(empty)"}`,
    "",
    "Matched FAQ entries:",
  ];
  for (const m of matches) {
    lines.push(`- Q: ${m.question}`);
    lines.push(`  A: ${m.answer}`);
    lines.push("");
  }
  lines.push(
    "For more: https://www.cryptbrew.com/help.html · support@cryptbrew.com · WhatsApp (707) 387-4140",
  );
  return lines.join("\n");
}
