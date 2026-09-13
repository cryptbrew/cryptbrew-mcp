import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  ABOUT,
  CONTACT,
  HOW_IT_WORKS,
  LINKS,
  LOCK_INFO,
  PRICING,
  faqEntries,
  formatFaqAnswer,
  matchFaq,
} from "../content.js";

describe("product content", () => {
  it("about mentions invoicing and non-custody", () => {
    assert.match(ABOUT, /Bitcoin invoicing/i);
    assert.match(ABOUT, /private keys/i);
    assert.match(ABOUT, /not long-term custody/i);
  });

  it("pricing includes 1% min 10 sats and free app, not Lock price", () => {
    assert.match(PRICING, /1%/);
    assert.match(PRICING, /10 sats/i);
    assert.match(PRICING, /free/i);
    assert.doesNotMatch(PRICING, /\$9\.99/);
    assert.match(LOCK_INFO, /\$9\.99/);
  });

  it("links include required URLs", () => {
    for (const url of [
      "https://www.cryptbrew.com",
      "https://www.cryptbrew.com/help.html",
      "https://www.cryptbrew.com/downloads/",
      "https://www.cryptbrew.com/llms.txt",
      "https://www.cryptbrew.com/support.html",
      "https://api.cryptbrew.com/redoc",
      "https://php.cryptbrew.com/payment-link.php",
      "https://api.cryptbrew.com/payments/health",
      "https://api.cryptbrew.com/health",
    ]) {
      assert.ok(LINKS.includes(url), `missing ${url}`);
    }
  });

  it("links still point Lock seekers to lock page or lock tool", () => {
    assert.match(LINKS, /lock/i);
  });

  it("how it works and lock and contact are non-empty", () => {
    assert.ok(HOW_IT_WORKS.length > 80);
    assert.match(LOCK_INFO, /Touch ID/i);
    assert.match(LOCK_INFO, /cryptbrew\/tap/);
    assert.match(LOCK_INFO, /separate/i);
    assert.match(CONTACT, /support@cryptbrew\.com/);
    assert.match(CONTACT, /707/);
    assert.match(CONTACT, /hello@cryptbrew\.com/);
  });
});

describe("faq", () => {
  it("loads 8–15 FAQ entries", () => {
    assert.ok(faqEntries.length >= 8 && faqEntries.length <= 15);
  });

  it("matches fee-related questions", () => {
    const hits = matchFaq("What are the fees?");
    assert.ok(hits.length >= 1);
    assert.match(hits[0]!.answer, /1%/);
  });

  it("matches custody questions", () => {
    const hits = matchFaq("Do you store my private keys?");
    assert.ok(hits.some((h) => /private keys/i.test(h.answer)));
  });

  it("formatFaqAnswer returns structured text", () => {
    const text = formatFaqAnswer("How do I get support?");
    assert.match(text, /Matched FAQ/);
    assert.match(text, /support@cryptbrew\.com|WhatsApp/i);
  });
});
