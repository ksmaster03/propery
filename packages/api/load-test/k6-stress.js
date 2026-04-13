// === k6 Stress Test — เป้าหมาย 10000 VUs ===
// Ramping up ถึง 10000 VUs ที่กำลังเต็มที่
// Threshold: P95 < 2000ms, error rate < 5% (ผ่อนปรนกว่า smoke เพราะเป็น stress)
//
// รัน:
//   k6 run k6-stress.js
//   K6_BASE_URL=https://doa.growgenius.co.th k6 run k6-stress.js

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const requestDuration = new Trend('request_duration');

// === Stress scenarios — ramp-up ทีละขั้น ===
export const options = {
  scenarios: {
    stress: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 100 },    // warm-up
        { duration: '1m',  target: 500 },    // ramp to 500
        { duration: '1m',  target: 2000 },   // ramp to 2000
        { duration: '2m',  target: 5000 },   // ramp to 5000
        { duration: '2m',  target: 10000 },  // ramp to 10000 (peak)
        { duration: '1m',  target: 10000 },  // hold 10000
        { duration: '30s', target: 0 },      // cooldown
      ],
      gracefulRampDown: '30s',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 2s under heavy stress
    errors: ['rate<0.05'],             // < 5% error
    'http_req_duration{endpoint:health}': ['p(95)<500'],
  },
};

const BASE_URL = __ENV.K6_BASE_URL || 'https://doa.growgenius.co.th';

export default function () {
  // 70% ของ traffic = health check (lightweight)
  // 30% = dashboard + other read APIs
  const rand = Math.random();

  if (rand < 0.7) {
    const res = http.get(`${BASE_URL}/api/health`, {
      tags: { endpoint: 'health' },
      timeout: '10s',
    });
    check(res, {
      'health status 200': (r) => r.status === 200,
    }) || errorRate.add(1);
    requestDuration.add(res.timings.duration);
  } else {
    // ทำ public endpoint (ไม่ต้อง auth)
    const res = http.get(`${BASE_URL}/`, {
      tags: { endpoint: 'homepage' },
      timeout: '10s',
    });
    check(res, {
      'homepage status 200': (r) => r.status === 200,
    }) || errorRate.add(1);
    requestDuration.add(res.timings.duration);
  }

  sleep(Math.random() * 2); // 0-2s think time
}

export function handleSummary(data) {
  const summary = {
    timestamp: new Date().toISOString(),
    max_vus: data.metrics.vus?.values.max || 0,
    iterations: data.metrics.iterations?.values.count || 0,
    http_reqs: data.metrics.http_reqs?.values.count || 0,
    http_req_failed_rate: data.metrics.http_req_failed?.values.rate || 0,
    p50_ms: data.metrics.http_req_duration?.values['p(50)'] || 0,
    p95_ms: data.metrics.http_req_duration?.values['p(95)'] || 0,
    p99_ms: data.metrics.http_req_duration?.values['p(99)'] || 0,
    avg_ms: data.metrics.http_req_duration?.values.avg || 0,
    max_ms: data.metrics.http_req_duration?.values.max || 0,
    errors_rate: data.metrics.errors?.values.rate || 0,
  };

  const output = `
╔══════════════════════════════════════════════════╗
║       k6 STRESS Test — 10000 VUs Peak           ║
║         DOA Commercial Lease System              ║
╠══════════════════════════════════════════════════╣
║  Timestamp:      ${summary.timestamp.padEnd(31)}║
║  Peak VUs:       ${String(summary.max_vus).padEnd(31)}║
║  Iterations:     ${String(summary.iterations).padEnd(31)}║
║  Total requests: ${String(summary.http_reqs).padEnd(31)}║
║  RPS (avg):      ${((summary.http_reqs / 480).toFixed(1) + ' req/s').padEnd(31)}║
╠══════════════════════════════════════════════════╣
║  Response Times (ms):                            ║
║    P50:          ${summary.p50_ms.toFixed(0).padEnd(31)}║
║    P95:          ${summary.p95_ms.toFixed(0).padEnd(31)}║
║    P99:          ${summary.p99_ms.toFixed(0).padEnd(31)}║
║    Max:          ${summary.max_ms.toFixed(0).padEnd(31)}║
║    Avg:          ${summary.avg_ms.toFixed(0).padEnd(31)}║
║  Error rate:     ${((summary.errors_rate * 100).toFixed(2) + '%').padEnd(31)}║
║  Req failed:     ${((summary.http_req_failed_rate * 100).toFixed(2) + '%').padEnd(31)}║
╠══════════════════════════════════════════════════╣
║  Thresholds:                                     ║
║    P95 < 2000ms       ${((summary.p95_ms < 2000 ? '✅ PASS' : '❌ FAIL')).padEnd(27)}║
║    Errors < 5%        ${((summary.errors_rate < 0.05 ? '✅ PASS' : '❌ FAIL')).padEnd(27)}║
╚══════════════════════════════════════════════════╝
`;

  return {
    'stdout': output,
    'stress-summary.json': JSON.stringify(summary, null, 2),
  };
}
