// === k6 Smoke + Load Test ตาม guideline ===
// ตัวชี้วัด: P95 < 500ms, error rate < 1%
//
// รัน:
//   k6 run packages/api/load-test/k6-smoke.js
//
// Environment:
//   K6_BASE_URL=https://doa.growgenius.co.th k6 run ...

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const loginDuration = new Trend('login_duration');

// === Scenarios ===
export const options = {
  scenarios: {
    // Smoke test — ดูว่าระบบขึ้นไหม
    smoke: {
      executor: 'constant-vus',
      vus: 1,
      duration: '30s',
      tags: { test_type: 'smoke' },
    },

    // Load test — ramp-up ถึง 50 users, hold 2 min
    load: {
      executor: 'ramping-vus',
      startTime: '30s',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 10 },   // warm-up
        { duration: '1m', target: 50 },    // ramp-up to 50
        { duration: '2m', target: 50 },    // hold at 50
        { duration: '30s', target: 0 },    // ramp-down
      ],
      tags: { test_type: 'load' },
    },
  },

  // === Thresholds (ตาม guideline) ===
  thresholds: {
    // P95 response time < 500ms
    http_req_duration: ['p(95)<500'],
    // Error rate < 1%
    errors: ['rate<0.01'],
    // Specific thresholds
    'http_req_duration{endpoint:dashboard}': ['p(95)<600'],
    'http_req_duration{endpoint:health}': ['p(95)<200'],
  },
};

const BASE_URL = __ENV.K6_BASE_URL || 'http://localhost:3001';

// Default user pool
const USERS = [
  { username: 'admin', password: 'admin123' },
  { username: 'operator1', password: 'operator123' },
];

// === Test scenarios ===
export default function () {
  // 1. Health check (ไม่ต้อง auth)
  const healthRes = http.get(`${BASE_URL}/api/health`, { tags: { endpoint: 'health' } });
  check(healthRes, {
    'health status 200': (r) => r.status === 200,
    'health has status field': (r) => r.json('status') === 'ok',
  }) || errorRate.add(1);

  sleep(0.5);

  // 2. Login
  const user = USERS[Math.floor(Math.random() * USERS.length)];
  const loginStart = Date.now();
  const loginRes = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify(user),
    {
      headers: { 'Content-Type': 'application/json' },
      tags: { endpoint: 'login' },
    }
  );
  loginDuration.add(Date.now() - loginStart);

  const loginOk = check(loginRes, {
    'login status 200': (r) => r.status === 200,
    'login returns accessToken': (r) => r.json('data.accessToken') !== undefined,
  });

  if (!loginOk) {
    errorRate.add(1);
    return;
  }

  const token = loginRes.json('data.accessToken');
  const authHeaders = {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };

  sleep(1);

  // 3. Dashboard KPI
  const kpiRes = http.get(`${BASE_URL}/api/dashboard/kpi`, {
    ...authHeaders,
    tags: { endpoint: 'dashboard' },
  });
  check(kpiRes, {
    'kpi status 200': (r) => r.status === 200,
    'kpi has totalUnits': (r) => r.json('data.totalUnits') !== undefined,
  }) || errorRate.add(1);

  sleep(0.5);

  // 4. Units list
  const unitsRes = http.get(`${BASE_URL}/api/units?page=1&limit=20`, {
    ...authHeaders,
    tags: { endpoint: 'units' },
  });
  check(unitsRes, {
    'units status 200': (r) => r.status === 200,
    'units returns array': (r) => Array.isArray(r.json('data')),
  }) || errorRate.add(1);

  sleep(0.5);

  // 5. Contracts list
  const contractsRes = http.get(`${BASE_URL}/api/contracts?page=1&limit=20`, {
    ...authHeaders,
    tags: { endpoint: 'contracts' },
  });
  check(contractsRes, {
    'contracts status 200': (r) => r.status === 200,
  }) || errorRate.add(1);

  sleep(1);
}

// === Summary output ===
export function handleSummary(data) {
  const summary = {
    timestamp: new Date().toISOString(),
    vus: data.metrics.vus?.values.max || 0,
    iterations: data.metrics.iterations?.values.count || 0,
    http_reqs: data.metrics.http_reqs?.values.count || 0,
    http_req_failed_rate: data.metrics.http_req_failed?.values.rate || 0,
    p95_ms: data.metrics.http_req_duration?.values['p(95)'] || 0,
    p99_ms: data.metrics.http_req_duration?.values['p(99)'] || 0,
    avg_ms: data.metrics.http_req_duration?.values.avg || 0,
    errors_rate: data.metrics.errors?.values.rate || 0,
  };

  return {
    'stdout': `
╔══════════════════════════════════════════════════╗
║           k6 Test Summary — DOA System          ║
╠══════════════════════════════════════════════════╣
║  Timestamp:      ${summary.timestamp.padEnd(31)}║
║  Max VUs:        ${String(summary.vus).padEnd(31)}║
║  Iterations:     ${String(summary.iterations).padEnd(31)}║
║  Total requests: ${String(summary.http_reqs).padEnd(31)}║
║  P95 (ms):       ${summary.p95_ms.toFixed(0).padEnd(31)}║
║  P99 (ms):       ${summary.p99_ms.toFixed(0).padEnd(31)}║
║  Avg (ms):       ${summary.avg_ms.toFixed(0).padEnd(31)}║
║  Error rate:     ${(summary.errors_rate * 100).toFixed(2) + '%'.padEnd(30)}║
╠══════════════════════════════════════════════════╣
║  Targets (guideline):                            ║
║    P95 < 500ms       ${(summary.p95_ms < 500 ? '✅' : '❌').padEnd(27)}║
║    Errors < 1%       ${(summary.errors_rate < 0.01 ? '✅' : '❌').padEnd(27)}║
╚══════════════════════════════════════════════════╝
`,
    'summary.json': JSON.stringify(summary, null, 2),
  };
}
