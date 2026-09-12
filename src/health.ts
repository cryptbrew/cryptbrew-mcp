export const HEALTH_URLS = [
  "https://api.cryptbrew.com/payments/health",
  "https://api.cryptbrew.com/health",
] as const;

export interface HealthProbeResult {
  url: string;
  ok: boolean;
  status?: number;
  bodyPreview?: string;
  error?: string;
  latencyMs: number;
}

export async function probeHealth(
  url: string,
  fetchImpl: typeof fetch = fetch,
  timeoutMs = 10_000,
): Promise<HealthProbeResult> {
  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetchImpl(url, {
      method: "GET",
      signal: controller.signal,
      headers: { Accept: "application/json, text/plain, */*" },
    });
    const text = await res.text();
    const preview = text.length > 500 ? `${text.slice(0, 500)}…` : text;
    return {
      url,
      ok: res.ok,
      status: res.status,
      bodyPreview: preview,
      latencyMs: Date.now() - started,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      url,
      ok: false,
      error: message,
      latencyMs: Date.now() - started,
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function checkAllHealth(
  fetchImpl: typeof fetch = fetch,
): Promise<HealthProbeResult[]> {
  return Promise.all(HEALTH_URLS.map((url) => probeHealth(url, fetchImpl)));
}

export function formatHealthReport(results: HealthProbeResult[]): string {
  const lines = ["Cryptbrew live health check:", ""];
  let allOk = true;
  for (const r of results) {
    if (!r.ok) allOk = false;
    lines.push(`URL: ${r.url}`);
    lines.push(`  ok: ${r.ok}`);
    if (r.status !== undefined) lines.push(`  status: ${r.status}`);
    lines.push(`  latencyMs: ${r.latencyMs}`);
    if (r.error) lines.push(`  error: ${r.error}`);
    if (r.bodyPreview) lines.push(`  body: ${r.bodyPreview}`);
    lines.push("");
  }
  lines.push(`Overall: ${allOk ? "healthy" : "degraded or unreachable"}`);
  return lines.join("\n");
}
