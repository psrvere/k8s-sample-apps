import http from 'k6/http';
import { check, sleep } from 'k6';

// Smoke test configuration - basic functionality verification
export const options = {
  vus: 1,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    http_req_failed: ['rate<0.01'], // Error rate should be less than 1%
  },
};

// Base URL - can be overridden via environment variable
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function() {
  // Test root endpoint
  const rootResponse = http.get(`${BASE_URL}/`);
  check(rootResponse, {
    'root endpoint status is 200': (r) => r.status === 200,
    'root endpoint has app info': (r) => {
      try {
        const data = r.json();
        return data.message && data.endpoints;
      } catch (e) {
        return false;
      }
    },
  });

  sleep(1);

  // Test health endpoint
  const healthResponse = http.get(`${BASE_URL}/health`);
  check(healthResponse, {
    'health endpoint status is 200': (r) => r.status === 200,
    'health endpoint has pod info': (r) => {
      try {
        const data = r.json();
        return data.status === 'healthy' && data.pod;
      } catch (e) {
        return false;
      }
    },
  });

  sleep(1);

  // Test data endpoint
  const dataResponse = http.get(`${BASE_URL}/api/data`);
  check(dataResponse, {
    'data endpoint status is 200': (r) => r.status === 200,
    'data endpoint has request id': (r) => {
      try {
        const data = r.json();
        return data.requestId && data.pod;
      } catch (e) {
        return false;
      }
    },
  });

  sleep(1);

  // Test metrics endpoint
  const metricsResponse = http.get(`${BASE_URL}/metrics`);
  check(metricsResponse, {
    'metrics endpoint status is 200': (r) => r.status === 200,
    'metrics endpoint has memory info': (r) => {
      try {
        const data = r.json();
        return data.memory && data.cpu;
      } catch (e) {
        return false;
      }
    },
  });

  sleep(2);
}

export function handleSummary(data) {
  return {
    'smoke-test-summary.json': JSON.stringify(data, null, 2),
  };
}
