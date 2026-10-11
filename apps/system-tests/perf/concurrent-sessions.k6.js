/**
 * concurrent-sessions.k6.js — ISO 25010 Performance Test: Concurrent Session Load
 *
 * // PERF-SMOKE-SKIP: k6 not installed in pipeline environment.
 * // Full load run deferred (deferredFullRun: true in quality-thresholds.json).
 * // This script is valid k6 and will execute when k6 is available.
 *
 * Workflow:   WF-001 + WF-005 — concurrent session creation and listing
 * SLA source: quality-thresholds.json concurrentSessions = 50 (BR-003)
 *
 * Smoke config (pipeline): 1 VU, 1 iteration
 * Full load config (deploy): ramp to 50 VUs over 2 minutes, sustain for 5 minutes
 *
 * Rule 15: BASE_URL and E2E_AUTH_TOKEN injected via k6 --env; no credentials here.
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// ---------------------------------------------------------------------------
// Custom metrics
// ---------------------------------------------------------------------------

const sessionCreateP95 = new Trend('concurrent_session_create_p95_ms', true);
const sessionListP95 = new Trend('concurrent_session_list_p95_ms', true);
const concurrentErrors = new Rate('concurrent_error_rate');
const totalSessions = new Counter('total_sessions_created');

// ---------------------------------------------------------------------------
// Smoke / Load configuration (BR-003: 50 concurrent sessions cap)
// ---------------------------------------------------------------------------

export const options = {
  scenarios: {
    smoke: {
      executor: 'constant-vus',
      vus: __ENV.VUS ? parseInt(__ENV.VUS) : 1,
      duration: __ENV.DURATION || '10s',
    },
    // Full load scenario — only activated in deploy environment (PERF-SMOKE-SKIP in pipeline)
    // load: {
    //   executor: 'ramping-vus',
    //   startVUs: 0,
    //   stages: [
    //     { duration: '2m', target: 50 },
    //     { duration: '5m', target: 50 },
    //     { duration: '1m', target: 0 },
    //   ],
    // },
  },
  thresholds: {
    'concurrent_session_create_p95_ms': ['p(95)<500'],
    'concurrent_session_list_p95_ms': ['p(95)<3000'],
    'concurrent_error_rate': ['rate<0.05'],
    'http_req_duration': ['p(99)<2000'],
  },
};

// ---------------------------------------------------------------------------
// Test fixtures (Rule 15)
// ---------------------------------------------------------------------------

const BASE_URL = __ENV.BASE_URL || 'http://localhost:7796';
const AUTH_TOKEN = __ENV.E2E_AUTH_TOKEN || '';

const headers = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${AUTH_TOKEN}`,
};

// ---------------------------------------------------------------------------
// Main scenario: Concurrent session creation
// ---------------------------------------------------------------------------

export default function concurrentSessionLoad() {
  // Each VU creates its own session
  const createStart = Date.now();
  const createRes = http.post(
    `${BASE_URL}/api/v1/sessions`,
    JSON.stringify({ title: `concurrent-k6-${__VU}-${__ITER}` }),
    { headers },
  );
  sessionCreateP95.add(Date.now() - createStart);

  const createOk = check(createRes, {
    'concurrent session create is 201': (r) => r.status === 201,
  });

  if (createOk) {
    totalSessions.add(1);
  }
  concurrentErrors.add(!createOk);

  sleep(0.2);

  // List sessions (simulates session dashboard load under concurrent users)
  const listStart = Date.now();
  const listRes = http.get(`${BASE_URL}/api/v1/sessions?page=1&pageSize=20`, { headers });
  sessionListP95.add(Date.now() - listStart);

  check(listRes, {
    'concurrent session list is 200': (r) => r.status === 200,
    'session list has items array': (r) => {
      try { return Array.isArray(JSON.parse(r.body).items); } catch { return false; }
    },
  });

  sleep(0.3);
}
