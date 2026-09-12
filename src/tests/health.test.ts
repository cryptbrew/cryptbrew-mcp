import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  HEALTH_URLS,
  formatHealthReport,
  probeHealth,
  checkAllHealth,
} from "../health.js";

describe("health helpers", () => {
  it("defines both health endpoints", () => {
    assert.deepEqual([...HEALTH_URLS], [
      "https://api.cryptbrew.com/payments/health",
      "https://api.cryptbrew.com/health",
    ]);
  });

  it("probeHealth records success via mock fetch", async () => {
    const mockFetch: typeof fetch = async () =>
      new Response(JSON.stringify({ status: "ok" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    const result = await probeHealth(HEALTH_URLS[0], mockFetch);
    assert.equal(result.ok, true);
    assert.equal(result.status, 200);
    assert.ok(result.bodyPreview?.includes("ok"));
  });

  it("probeHealth records failure via mock fetch", async () => {
    const mockFetch: typeof fetch = async () => {
      throw new Error("network down");
    };
    const result = await probeHealth(HEALTH_URLS[1], mockFetch);
    assert.equal(result.ok, false);
    assert.match(result.error ?? "", /network down/);
  });

  it("formatHealthReport summarizes results", async () => {
    const mockFetch: typeof fetch = async (input) => {
      const url = String(input);
      if (url.includes("payments")) {
        return new Response("payments-ok", { status: 200 });
      }
      return new Response("fail", { status: 503 });
    };
    const results = await checkAllHealth(mockFetch);
    const report = formatHealthReport(results);
    assert.match(report, /payments\/health/);
    assert.match(report, /degraded|healthy/);
    assert.match(report, /503|ok/);
  });
});
