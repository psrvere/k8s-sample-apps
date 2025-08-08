import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');

// Test configuration
export const options = {
  stages: [
    // Ramp up to 10 users over 30 seconds
    { duration: '30s', target: 10 },
    // Stay at 10 users for 2 minutes
    { duration: '2m', target: 10 },
    // Ramp up to 50 users over 1 minute
    { duration: '1m', target: 50 },
    // Stay at 50 users for 3 minutes
    { duration: '3m', target: 50 },
    // Ramp down to 0 users over 30 seconds
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests should be below 2s
    http_req_failed: ['rate<0.1'], // Error rate should be less than 10%
    errors: ['rate<0.1'],
  },
};

// Base URL - can be overridden via environment variable
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Default function - called for each virtual user
// CURRENT APPROACH: Random test selection for realistic mixed load
// Each VU randomly picks one of four test types to execute
// This creates a realistic mix of different request types during the load test
export default function() {
  // Available test scenarios - each VU randomly picks one
  const scenarios = ['healthCheck', 'cpuLoadTest', 'loadLevelsTest', 'metricsTest'];
  const randomScenario = scenarios[Math.floor(Math.random() * scenarios.length)];
  
  // Execute the randomly selected test scenario
  switch (randomScenario) {
    case 'healthCheck':
      healthCheck();      // Light load - basic availability check
      break;
    case 'cpuLoadTest':
      cpuLoadTest();      // Heavy load - CPU-intensive operations (triggers HPA)
      break;
    case 'loadLevelsTest':
      loadLevelsTest();   // Variable load - different intensity levels
      break;
    case 'metricsTest':
      metricsTest();      // Light load - system monitoring
      break;
    default:
      healthCheck();      // Fallback to health check
  }
}

// Health check scenario
export function healthCheck() {
  const response = http.get(`${BASE_URL}/health`);
  
  const checkResult = check(response, {
    'health check status is 200': (r) => r.status === 200,
    'health check response time < 500ms': (r) => r.timings.duration < 500,
    'health check has pod info': (r) => {
      try {
        return r.json('pod') !== undefined;
      } catch (e) {
        return false;
      }
    },
  });

  if (!checkResult) {
    console.log(`⚠️ Health check failed - Status: ${response.status}, Response Time: ${response.timings.duration}ms`);
  }
  
  errorRate.add(response.status !== 200);
  responseTime.add(response.timings.duration);
  
  sleep(1);
}

// CPU load test scenario
export function cpuLoadTest() {
  const durations = [1000, 2000, 3000];
  const duration = durations[Math.floor(Math.random() * durations.length)];
  
  const response = http.get(`${BASE_URL}/cpu-load?duration=${duration}`);
  
  const checkResult = check(response, {
    'cpu load status is 200': (r) => r.status === 200,
    'cpu load response time < 10000ms': (r) => r.timings.duration < 10000,
    'cpu load has result': (r) => {
      try {
        return r.json('result') !== undefined;
      } catch (e) {
        return false;
      }
    },
  });

  if (!checkResult) {
    console.log(`⚠️ CPU load test failed - Duration: ${duration}ms, Status: ${response.status}, Response Time: ${response.timings.duration}ms`);
  }
  
  errorRate.add(response.status !== 200);
  responseTime.add(response.timings.duration);
  
  sleep(2);
}

// Load levels test scenario
export function loadLevelsTest() {
  const levels = ['low', 'medium', 'high', 'extreme'];
  const level = levels[Math.floor(Math.random() * levels.length)];
  
  const response = http.get(`${BASE_URL}/load/${level}`);
  
  const checkResult = check(response, {
    'load level status is 200': (r) => r.status === 200,
    'load level has correct intensity': (r) => {
      try {
        const json = r.json();
        return json && json.message && json.message.includes(level);
      } catch (e) {
        return false;
      }
    },
    'load level has duration': (r) => {
      try {
        return r.json('duration') !== undefined;
      } catch (e) {
        return false;
      }
    },
  });

  if (!checkResult) {
    console.log(`⚠️ Load level test failed - Level: ${level}, Status: ${response.status}, Response Time: ${response.timings.duration}ms`);
  }
  
  errorRate.add(response.status !== 200);
  responseTime.add(response.timings.duration);
  
  sleep(1);
}

// Metrics endpoint test
export function metricsTest() {
  const response = http.get(`${BASE_URL}/metrics`);
  
  check(response, {
    'metrics status is 200': (r) => r.status === 200,
    'metrics has memory info': (r) => {
      try {
        return r.json('memory') !== undefined;
      } catch (e) {
        return false;
      }
    },
    'metrics has cpu info': (r) => {
      try {
        return r.json('cpu') !== undefined;
      } catch (e) {
        return false;
      }
    },
  });
  
  errorRate.add(response.status !== 200);
  responseTime.add(response.timings.duration);
  
  sleep(5);
}

// Setup function - runs once before the test
export function setup() {
  console.log(`🚀 Starting k6 load test against: ${BASE_URL}`);
  console.log('📊 Test configuration:');
  console.log(`  - Stages: ${JSON.stringify(options.stages)}`);
  console.log(`  - Thresholds: ${JSON.stringify(options.thresholds)}`);
  
  // Verify the service is running
  const healthResponse = http.get(`${BASE_URL}/health`);
  if (healthResponse.status !== 200) {
    console.log(`❌ Service not available at ${BASE_URL}/health - Status: ${healthResponse.status}`);
    throw new Error(`Service not available at ${BASE_URL}/health`);
  }
  
  console.log('✅ Service is available and ready for testing');
}

// Teardown function - runs once after the test
export function teardown(data) {
  console.log('🏁 Load test completed');
}

// Handle test results
export function handleSummary(data) {
  console.log('\n📊 Load Test Summary:');
  console.log(`Total Requests: ${data.metrics.http_reqs.values.count}`);
  console.log(`Failed Requests: ${(data.metrics.http_req_failed.values.rate * 100).toFixed(2)}%`);
  console.log(`Average Response Time: ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms`);
  console.log(`95th Percentile: ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms`);
  console.log(`Max Response Time: ${data.metrics.http_req_duration.values.max.toFixed(2)}ms`);
  
  return {
    'load-test-summary.json': JSON.stringify(data, null, 2),
  };
}
