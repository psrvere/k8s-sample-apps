# Auto-Scaling with Horizontal Pod Autoscaler (HPA)

**Description:** Deploy a CPU-intensive TypeScript web application and configure HPA to automatically scale pods based on CPU and memory usage metrics.

## 🏗️ Architecture

This project demonstrates Kubernetes Horizontal Pod Autoscaler (HPA) with:

- **TypeScript Node.js Application**: CPU-intensive web server with load testing endpoints
- **Kubernetes Deployment**: Multi-replica deployment with resource limits
- **HPA Configuration**: CPU and memory-based autoscaling
- **Load Testing Tool**: k6-based load generator for testing HPA

## 📁 Project Structure

```
autoscaling/
├── app/                    # TypeScript application
│   ├── src/
│   │   └── app.ts         # Main application with CPU-intensive endpoints
│   ├── package.json        # Dependencies and scripts
│   ├── tsconfig.json      # TypeScript configuration
│   └── Dockerfile         # Multi-stage Docker build
├── k8s/                   # Kubernetes manifests
│   ├── namespace.yaml      # Namespace for the application
│   ├── deployment.yaml    # Application deployment
│   ├── service.yaml       # Service to expose the app
│   ├── hpa.yaml          # Horizontal Pod Autoscaler
│   └── ingress.yaml      # Ingress for external access
├── scripts/
│   ├── k6-smoke-test.js  # Quick validation test
│   └── logger.js          # Winston logger for scripts
└── README.md             # This file
```

## 🚀 Quick Start

### 1. Build the Application

```bash
cd autoscaling/app
npm install
npm run build
```

### 2. Build Docker Image

```bash
# From the app directory
docker build -t autoscaling-app:latest .
# push to a registery
```

### 3. Deploy to Kubernetes

```bash
# Apply all manifests
kubectl apply -f k8s/

# Verify deployment
kubectl get pods -n autoscaling-demo
kubectl get hpa -n autoscaling-demo
```

### 4. Test the Application

```bash
# Port forward to access the service
kubectl port-forward svc/autoscaling-app-service 8080:80 -n autoscaling-demo

# Test endpoints
curl http://localhost:8080/
curl http://localhost:8080/health
curl http://localhost:8080/cpu-load
```

## 🔧 Application Endpoints

The TypeScript application provides several endpoints for testing HPA:

- **`/`**: Application info and available endpoints
- **`/health`**: Health check endpoint
- **`/cpu-load?duration=1000`**: CPU-intensive task (default 1 second)
- **`/load/{level}`**: Load testing with different intensities:
  - `low`: 500ms CPU load
  - `medium`: 2s CPU load
  - `high`: 5s CPU load
  - `extreme`: 10s CPU load
- **`/metrics`**: Application metrics (memory, CPU usage)

## 📊 HPA Configuration

The HPA is configured with:

- **Min Replicas**: 2
- **Max Replicas**: 10
- **CPU Target**: 70% utilization
- **Memory Target**: 80% utilization
- **Scale Up**: Aggressive (100% increase, 15s period)
- **Scale Down**: Conservative (10% decrease, 60s period)

## 🧪 Load Testing with k6

### Prerequisites

Install k6 for load testing:

```bash
# macOS
brew install k6

### Available Test Scripts

#### 1. Smoke Test (`k6-smoke-test.js`)
Quick validation of all application endpoints.

**Usage:**
```bash
# From app directory
npm run smoke-test

# Direct k6 command
k6 run app/scripts/k6-smoke-test.js

**What it tests:**
- Health endpoint (`/health`)
- Root endpoint (`/`)
- Metrics endpoint (`/metrics`)
- CPU load endpoint (`/cpu-load`)
- Load levels endpoint (`/load/{level}`)

**Configuration:**
- 1 virtual user
- 30 seconds duration
- 95% of requests should complete in < 1 second
- Error rate should be < 1%

## 📈 Monitoring HPA

### Check HPA Status

```bash
# View HPA details
kubectl describe hpa autoscaling-app-hpa -n autoscaling-demo

# Watch HPA in real-time
kubectl get hpa autoscaling-app-hpa -n autoscaling-demo -w
```

### Monitor Pod Scaling

```bash
# Watch pods scale up/down
kubectl get pods -n autoscaling-demo -w

# Check resource usage
kubectl top pods -n autoscaling-demo
```

### View Application Metrics

```bash
# Get metrics from application
curl http://localhost:8080/metrics | jq
```

## 🧹 Cleanup

```bash
# Remove all resources
kubectl delete namespace autoscaling-demo

# Or remove individual resources
kubectl delete -f k8s/
```

### Q: What are the different memory types shown in the `/metrics` endpoint?

The `/metrics` endpoint displays four different memory metrics from Node.js `process.memoryUsage()`:

- **`rss` (Resident Set Size)**: The total memory allocated to the process in RAM. This includes:
  - JavaScript heap memory
  - Native objects and buffers
  - Stack memory
  - Code segments
  - This is the most important metric for monitoring actual memory consumption
  - **Unit: Megabytes (MB)**

- **`heapTotal`**: The total size of the V8 JavaScript heap memory allocated. This represents:
  - The total heap space available to the JavaScript engine
  - Includes both used and unused heap memory
  - Grows as the application needs more memory
  - **Unit: Megabytes (MB)**

- **`heapUsed`**: The actual amount of heap memory currently being used by JavaScript objects. This shows:
  - Active JavaScript objects in memory
  - The portion of heapTotal that contains live data
  - Most relevant for monitoring application memory usage
  - **Unit: Megabytes (MB)**

- **`external`**: Memory used by C++ objects bound to JavaScript objects. This includes:
  - Buffers (when not using the heap)
  - Native addons
  - Network sockets
  - File handles
  - Other native resources
  - **Unit: Megabytes (MB)**

**CPU Metrics:**
- **`user`**: CPU time spent in user mode (microseconds)
- **`system`**: CPU time spent in system/kernel mode (microseconds)

**Other Metrics:**
- **`uptime`**: Application uptime in seconds
- **`pod`**: Kubernetes pod name (or "unknown" if not in K8s)
- **`timestamp`**: ISO timestamp of the metrics snapshot

**Example Output:**
```bash
$ curl http://localhost:3000/metrics
{
  "memory": {
    "rss": 219, # MB
    "heapTotal": 87, # MB
    "heapUsed": 85, # MB
    "external": 5 # MB
  },
  "cpu": {
    "user": 1108395, # micro seconds
    "system": 97678 # micro seconds
  },
  "uptime": 116.594573917, # seconds
  "pod": "unknown", # Not running in cluster
  "timestamp": "2025-08-08T05:48:57.624Z"
}
```

**Why these matter for HPA:**
- **RSS** is typically used for Kubernetes memory limits and HPA scaling decisions
- **heapUsed** helps identify memory leaks in the application
- **external** can indicate issues with native dependencies or buffer usage
- **heapTotal** shows memory allocation patterns over time

### Q: Why do we need metrics-server for Kind clusters?

Kind clusters don't come with metrics-server installed by default, unlike production Kubernetes clusters (EKS, GKE, AKS) which include it pre-installed.

**Why Metrics Server is Required for HPA:**
- **HPA needs CPU/memory metrics** to make scaling decisions
- **Without metrics-server**, HPA shows `<unknown>` for targets
- **HPA cannot scale** without knowing current resource usage

**The Problem:**
```bash
# Without metrics-server
kubectl get hpa
NAME    REFERENCE    TARGETS                    MINPODS   MAXPODS   REPLICAS
hpa     Deployment   cpu: <unknown>/70%        2         10        2
#                                    ↑
#                              No metrics available
```

**The Solution:**
```bash
# Install metrics-server for Kind
kubectl apply -f k8s/metrics-server.yaml

# After installation
kubectl get hpa
NAME    REFERENCE    TARGETS                    MINPODS   MAXPODS   REPLICAS
hpa     Deployment   cpu: 45%/70%              2         10        2
#                                    ↑
#                              Now showing real metrics
```

**Kind-Specific Configuration:**
The metrics-server YAML includes Kind-specific settings:
```yaml
args:
- --kubelet-insecure-tls  # Bypasses TLS for Kind clusters
- --kubelet-preferred-address-types=InternalIP,ExternalIP,Hostname
```

**What Metrics Server Does:**
- **Scrapes** CPU/memory usage from each pod every 15 seconds
- **Exposes** metrics via Kubernetes Metrics API
- **Enables** HPA to make scaling decisions
- **Provides** `kubectl top pods` functionality

**Production vs Kind Clusters:**
| Feature | Production (EKS/GKE/AKS) | Kind Cluster |
|---------|---------------------------|--------------|
| Metrics Server | ✅ Pre-installed | ❌ Manual installation |
| Load Balancer | ✅ External LB | ❌ Port-forward only |
| Ingress Controller | ✅ Pre-installed | ❌ Manual installation |

**Verification Commands:**
```bash
# Check if metrics-server is working
kubectl top pods -n autoscaling-demo

# Check HPA targets
kubectl get hpa -n autoscaling-demo

# Verify metrics API
kubectl get apiservice v1beta1.metrics.k8s.io
```

### Q: Why do we have to export functions in k6 scripts?

k6 requires `export` statements because it uses a specialized execution model different from regular Node.js applications:

**k6's Execution Model:**
- **Custom JavaScript environment** (not Node.js)
- **Specific execution lifecycle** with defined entry points
- **Requires explicit exports** to know which functions to call

**Required k6 Exports:**
```javascript
// Main test function - called for each virtual user
export default function() {
  // Your test logic here
}

// Setup function - runs once before test starts
export function setup() {
  // Initialize test environment
}

// Teardown function - runs once after test ends
export function teardown(data) {
  // Cleanup
}

// Summary handler - processes test results
export function handleSummary(data) {
  // Generate reports
}
```

**k6's Execution Flow:**
```
1. setup() → Runs once
2. default function() → Runs for each VU (Virtual User)
3. teardown() → Runs once
4. handleSummary() → Processes results
```

**Why Not Regular Node.js Patterns?**
```javascript
// ❌ This won't work in k6
function main() {
  // Test logic
}

// ❌ k6 doesn't know about this
if (require.main === module) {
  main();
}
```

**k6's JavaScript Environment:**
- **No `require()`** (except for built-in k6 modules)
- **No Node.js APIs** (no `fs`, `path`, etc.)
- **Custom global objects** (`__ENV`, `__VU`, etc.)
- **Specific export requirements**

**Benefits of k6's Export Model:**
- ✅ **Clear lifecycle hooks** for test setup/teardown
- ✅ **Enables parallel execution** across virtual users
- ✅ **Supports distributed load testing**
- ✅ **Built-in metrics collection**
- ✅ **Integrates with monitoring systems**

The exports are **k6's way of defining the test contract** - like an interface that k6 expects your test to implement!