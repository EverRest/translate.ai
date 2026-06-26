#!/usr/bin/env node

const baseUrl = process.env.API_BASE_URL ?? 'http://localhost:3000';
const iterations = Number(process.env.PERF_ITERATIONS ?? 100);
const concurrency = Number(process.env.PERF_CONCURRENCY ?? 10);

function percentile(values, p) {
  if (values.length === 0) {
    return 0;
  }
  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.min(
    sorted.length - 1,
    Math.ceil((p / 100) * sorted.length) - 1,
  );
  return sorted[index] ?? 0;
}

async function timedFetch(path) {
  const started = performance.now();
  const response = await fetch(`${baseUrl}${path}`);
  const durationMs = performance.now() - started;
  if (!response.ok) {
    throw new Error(`${path} failed with ${response.status}`);
  }
  return durationMs;
}

async function runBatch(path, count) {
  const durations = [];
  let cursor = 0;

  async function worker() {
    while (cursor < count) {
      cursor += 1;
      durations.push(await timedFetch(path));
    }
  }

  await Promise.all(
    Array.from({ length: concurrency }, () => worker()),
  );

  return durations;
}

function summarize(label, durations) {
  const totalMs = durations.reduce((sum, value) => sum + value, 0);
  const avg = totalMs / durations.length;
  const rps = (durations.length / totalMs) * 1000;

  console.log(`\n${label}`);
  console.log(`  requests: ${durations.length}`);
  console.log(`  avg: ${avg.toFixed(2)} ms`);
  console.log(`  p95: ${percentile(durations, 95).toFixed(2)} ms`);
  console.log(`  max: ${Math.max(...durations).toFixed(2)} ms`);
  console.log(`  rps: ${rps.toFixed(2)}`);
}

async function main() {
  console.log(`Performance test against ${baseUrl}`);
  console.log(`iterations=${iterations}, concurrency=${concurrency}`);

  summarize('/api/v1/health', await runBatch('/api/v1/health', iterations));
  summarize('/metrics', await runBatch('/metrics', Math.min(iterations, 30)));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
