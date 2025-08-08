import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics for HPA testing
const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');
const cpuLoadResponseTime = new Trend('cpu_load_response_time');

// HPA-specific test configuration
export const options = {
  scenarios: {
    // Baseline load - should not trigger scaling
    baseline: {
      executor: 'constant-vus',
      vus: 2,
      duration: '2m',
      exec: 'baselineLoad',
      tags: { scenario: 'baseline' },
    },
    // Medium load - should trigger some scaling
    medium_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 5 },
        { duration: '2m', target: 5 },
        { duration: '30s', target: 0 },
      ],
      exec: 'mediumLoad',
      tags: { scenario: 'medium_load' },
    },
    // High load - should trigger significant scaling
    high_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 10 },
        { duration: '3m', target: 10 },
        { duration: '30s', target: 0 },
      ],
      exec: 'highLoad',
      tags: { scenario: 'high_load' },
    },
    // Burst load - sudden spike to test rapid scaling
    burst_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 20 },
        { duration: '1m', target: 20 },
        { duration: '10s', target: 0 },
      ],
      exec: 'burstLoad',
      tags: { scenario: 'burst_load' },
    },
    // Sustained load - long duration to test scaling stability
    sustained_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 8 },
        { duration: '5m', target: 8 },
        { duration: '1m', target: 0 },
      ],
      exec: 'sustainedLoad',
      tags: { scenario: 'sustained_load' },
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<5000'], // 95% of requests should be below 5s
    http_req_failed: ['rate<0.05'], // Error rate should be less than 5%
    'cpu_load_response_time': ['p(95)<10000'], // CPU load requests should be below 10s
  },
};

// Base URL - can be overridden via environment variable
const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000';

// Baseline load - minimal CPU usage
export function baselineLoad() {
  const response = http.get(`${BASE_URL}/health`);
  
  const checkResult = check(response, {
    'baseline health check status is 200': (r) => r.status === 200,
    'baseline response time < 200ms': (r) => r.timings.duration < 200,
  });

  if (!checkResult) {
    console.log(`⚠️ Baseline load check failed - Status: ${response.status}, Response Time: ${response.timings.duration}ms`);
  }
  
  errorRate.add(response.status !== 200);
  responseTime.add(response.timings.duration);
  
  sleep(2);
}

// Medium load - moderate CPU usage
export function mediumLoad() {
  const response = http.get(`${BASE_URL}/cpu-load?duration=1500`);
  
  const checkResult = check(response, {
    'medium load status is 200': (r) => r.status === 200,
    'medium load response time < 3000ms': (r) => r.timings.duration < 3000,
  });

  if (!checkResult) {
    console.log(`⚠️ Medium load check failed - Status: ${response.status}, Response Time: ${response.timings.duration}ms`);
  }
  
  errorRate.add(response.status !== 200);
  cpuLoadResponseTime.add(response.timings.duration);
  
  sleep(1);
}

// High load - intensive CPU usage
export function highLoad() {
  const response = http.get(`${BASE_URL}/cpu-load?duration=3000`);
  
  const checkResult = check(response, {
    'high load status is 200': (r) => r.status === 200,
    'high load response time < 8000ms': (r) => r.timings.duration < 8000,
  });

  if (!checkResult) {
    console.log(`⚠️ High load check failed - Status: ${response.status}, Response Time: ${response.timings.duration}ms`);
  }
  
  errorRate.add(response.status !== 200);
  cpuLoadResponseTime.add(response.timings.duration);
  
  sleep(0.5);
}

// Burst load - sudden high intensity
export function burstLoad() {
  const response = http.get(`${BASE_URL}/cpu-load?duration=4000`);
  
  const checkResult = check(response, {
    'burst load status is 200': (r) => r.status === 200,
    'burst load response time < 10000ms': (r) => r.timings.duration < 10000,
  });

  if (!checkResult) {
    console.log(`⚠️ Burst load check failed - Status: ${response.status}, Response Time: ${response.timings.duration}ms`);
  }
  
  errorRate.add(response.status !== 200);
  cpuLoadResponseTime.add(response.timings.duration);
  
  sleep(0.2);
}

// Sustained load - consistent moderate load
export function sustainedLoad() {
  const response = http.get(`${BASE_URL}/cpu-load?duration=2000`);
  
  const checkResult = check(response, {
    'sustained load status is 200': (r) => r.status === 200,
    'sustained load response time < 5000ms': (r) => r.timings.duration < 5000,
  });

  if (!checkResult) {
    console.log(`⚠️ Sustained load check failed - Status: ${response.status}, Response Time: ${response.timings.duration}ms`);
  }
  
  errorRate.add(response.status !== 200);
  cpuLoadResponseTime.add(response.timings.duration);
  
  sleep(1);
}

// Setup function
export function setup() {
  console.log(`🚀 Starting k6 HPA load test against: ${BASE_URL}`);
  console.log('📊 HPA Test Scenarios:');
  console.log('  - Baseline: 2 VUs for 2m (should not trigger scaling)');
  console.log('  - Medium: 5 VUs for 3m (should trigger some scaling)');
  console.log('  - High: 10 VUs for 4m (should trigger significant scaling)');
  console.log('  - Burst: 20 VUs for 1.5m (sudden spike test)');
  console.log('  - Sustained: 8 VUs for 7m (stability test)');
  
  // Verify the service is running
  const healthResponse = http.get(`${BASE_URL}/health`);
  if (healthResponse.status !== 200) {
    console.log(`❌ Service not available at ${BASE_URL}/health - Status: ${healthResponse.status}`);
    throw new Error(`Service not available at ${BASE_URL}/health`);
  }
  
  console.log('✅ Service is available and ready for HPA testing');
}

// Handle test results
export function handleSummary(data) {
  console.log('\n📊 HPA Test Summary:');
  console.log(`Total Requests: ${data.metrics.http_reqs.values.count}`);
  console.log(`Failed Requests: ${(data.metrics.http_req_failed.values.rate * 100).toFixed(2)}%`);
  console.log(`Average Response Time: ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms`);
  console.log(`95th Percentile: ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms`);
  console.log(`Max Response Time: ${data.metrics.http_req_duration.values.max.toFixed(2)}ms`);
  console.log(`CPU Load Avg Response Time: ${data.metrics.cpu_load_response_time.values.avg.toFixed(2)}ms`);
  
  return {
    'hpa-test-summary.json': JSON.stringify(data, null, 2),
  };
}
