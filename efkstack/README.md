# EFK Stack - Centralized Logging

**Description:** Implement centralized logging by deploying the EFK stack to collect, store, and visualize logs from cluster pods.

**Key Learnings:**
- DaemonSets for agents
- ConfigMaps for configurations
- Observability basics
- Includes GitHub source

## Architecture

The EFK stack consists of:
- **Elasticsearch**: Distributed search and analytics engine for storing logs
- **Fluentd**: Log collector and aggregator (runs as DaemonSet)
- **Kibana**: Web interface for searching and visualizing logs

## Q&A: Understanding EFK Components

### **What is Elasticsearch?** 🔍

**Elasticsearch** is a distributed, RESTful search and analytics engine built on Apache Lucene.

**Role in EFK Stack:**
- **Log Storage**: Acts as the central database for all collected logs
- **Search Engine**: Provides powerful search capabilities across all log data
- **Analytics**: Enables complex queries and aggregations on log data
- **Scalability**: Can handle massive amounts of log data with horizontal scaling

**Key Features:**
- Stores logs in JSON format with full-text search
- Supports complex queries and filters
- Provides RESTful API for data access
- Built-in clustering for high availability
- Real-time indexing of incoming logs

**Why we use it:** Without Elasticsearch, logs would just be scattered files. It provides the foundation for searching, analyzing, and storing logs in a structured way.

---

### **What is Fluentd?** 📥

**Fluentd** is an open-source data collector and log aggregator that can collect logs from various sources and forward them to various destinations.

**Role in EFK Stack:**
- **Log Collector**: Runs as a DaemonSet on every Kubernetes node
- **Log Parser**: Parses different log formats (JSON, plain text, etc.)
- **Log Router**: Routes logs to Elasticsearch with proper formatting
- **Buffer Management**: Handles log buffering and retry logic

**Key Features:**
- Collects logs from container stdout/stderr
- Enriches logs with Kubernetes metadata (pod name, namespace, etc.)
- Supports multiple input and output plugins
- Handles log buffering and retry on failures
- Lightweight and resource-efficient

**Why we use it:** Kubernetes doesn't have a built-in log aggregation system. Fluentd bridges this gap by collecting logs from all containers and forwarding them to Elasticsearch.

---

### **What is Kibana?** 📊

**Kibana** is a web-based data visualization and exploration platform for Elasticsearch.

**Role in EFK Stack:**
- **Log Visualization**: Provides web interface to view and search logs
- **Dashboard Creation**: Allows building custom dashboards and visualizations
- **Log Analysis**: Enables filtering, searching, and analyzing log data
- **User Interface**: Makes log data accessible to humans

**Key Features:**
- Web-based UI for log exploration
- Real-time log streaming
- Custom dashboard creation
- Advanced filtering and search capabilities
- Alerting and monitoring features
- Export capabilities for reports

**Why we use it:** Elasticsearch is powerful but not user-friendly. Kibana provides the human interface to interact with the log data stored in Elasticsearch.

---

### **How Do They Work Together?** 🔄

```
[Kubernetes Pods] → [Fluentd DaemonSet] → [Elasticsearch] → [Kibana]
     (Logs)           (Collect & Parse)      (Store & Index)   (Visualize)
```

1. **Kubernetes Pods** generate logs (stdout/stderr)
2. **Fluentd** (running on each node) collects these logs
3. **Fluentd** parses, enriches, and forwards logs to Elasticsearch
4. **Elasticsearch** stores and indexes the logs for fast searching
5. **Kibana** provides a web interface to search and visualize the logs

---

### **Benefits of EFK Stack** ✅

1. **Centralized Logging**: All logs in one place
2. **Real-time Monitoring**: See logs as they happen
3. **Powerful Search**: Find specific logs quickly
4. **Historical Analysis**: Analyze trends over time
5. **Troubleshooting**: Debug issues faster
6. **Compliance**: Meet audit requirements
7. **Scalability**: Handle growing log volumes

This is why the EFK stack is essential for any serious Kubernetes deployment - it transforms scattered log files into a powerful observability platform!

## Manual Deployment Steps

### 1. Create Namespace
```bash
kubectl apply -f k8s/namespace.yaml
```

### 2. Deploy RBAC Components
```bash
kubectl apply -f k8s/rbac/elasticsearch-rbac.yaml
kubectl apply -f k8s/rbac/fluentd-rbac.yaml
```

### 3. Deploy Elasticsearch
```bash
kubectl apply -f k8s/elasticsearch/configmap.yaml
kubectl apply -f k8s/elasticsearch/service.yaml
kubectl apply -f k8s/elasticsearch/statefulset.yaml
```

### 4. Deploy Fluentd
```bash
kubectl apply -f k8s/fluentd/configmap.yaml
kubectl apply -f k8s/fluentd/daemonset.yaml
```

### 5. Deploy Kibana
```bash
kubectl apply -f k8s/kibana/deployment.yaml
kubectl apply -f k8s/kibana/service.yaml
```

## Testing Steps

### 1. Verify Namespace Creation
```bash
kubectl get namespace efk-stack
```

### 2. Check RBAC Components
```bash
kubectl get serviceaccounts -n efk-stack
kubectl get clusterrole -l app=elasticsearch
kubectl get clusterrole -l app=fluentd
```

### 3. Monitor Elasticsearch Deployment
```bash
# Check StatefulSet status
kubectl get statefulset -n efk-stack

# Check pods
kubectl get pods -n efk-stack -l app=elasticsearch

# Check service
kubectl get service -n efk-stack elasticsearch

# Check logs
kubectl logs -n efk-stack -l app=elasticsearch

# Test Elasticsearch connectivity
kubectl port-forward -n efk-stack svc/elasticsearch 9200:9200
# Then in another terminal: curl http://localhost:9200/_cluster/health
```

### 4. Monitor Fluentd Deployment
```bash
# Check DaemonSet status
kubectl get daemonset -n efk-stack

# Check pods (should be one per node)
kubectl get pods -n efk-stack -l app=fluentd

# Check logs
kubectl logs -n efk-stack -l app=fluentd

# Verify Fluentd is collecting logs
kubectl logs -n efk-stack -l app=fluentd | grep "fluentd"
```

### 5. Monitor Kibana Deployment
```bash
# Check deployment status
kubectl get deployment -n efk-stack

# Check pods
kubectl get pods -n efk-stack -l app=kibana

# Check service
kubectl get service -n efk-stack kibana

# Check logs
kubectl logs -n efk-stack -l app=kibana
```

### 6. Access Kibana
```bash
# Get Kibana service external IP
kubectl get service -n efk-stack kibana

# Or use port-forward
kubectl port-forward -n efk-stack svc/kibana 5601:5601
# Then access http://localhost:5601 in browser
```

### 7. Generate Test Logs
```bash
# Deploy a test application to generate logs
kubectl run test-app --image=nginx --port=80 -n efk-stack

# Generate some logs
kubectl exec -n efk-stack test-app -- sh -c "echo 'Test log message' > /dev/stdout"

# Check if logs are being collected
kubectl logs -n efk-stack test-app
```

### 8. Verify Log Collection in Kibana
1. Open Kibana in browser (http://localhost:5601 or external IP)
2. Go to Stack Management > Index Patterns
3. Create index pattern: `k8s-*`
4. Go to Discover to view logs
5. Search for logs from your test application

### 9. Health Checks
```bash
# Check all components are running
kubectl get all -n efk-stack

# Check resource usage
kubectl top pods -n efk-stack

# Check persistent volumes
kubectl get pvc -n efk-stack

# Check events
kubectl get events -n efk-stack --sort-by='.lastTimestamp'
```

### 10. Troubleshooting Commands
```bash
# Check pod status and details
kubectl describe pod -n efk-stack <pod-name>

# Check service endpoints
kubectl get endpoints -n efk-stack

# Check ConfigMaps
kubectl get configmap -n efk-stack

# Check if Elasticsearch is responding
kubectl exec -n efk-stack <elasticsearch-pod> -- curl -s http://localhost:9200/_cluster/health

# Check Fluentd configuration
kubectl exec -n efk-stack <fluentd-pod> -- cat /fluentd/etc/fluent.conf
```

## Expected Results

After successful deployment:
- Elasticsearch pod should be in `Running` state
- Fluentd DaemonSet should have pods on each node
- Kibana pod should be in `Running` state
- You should be able to access Kibana UI
- Logs from cluster pods should be visible in Kibana
- Elasticsearch should show healthy cluster status

## Cleanup
```bash
kubectl delete namespace efk-stack
```

---

### **What are Disk Space Checks?**

Elasticsearch has built-in disk space monitoring to prevent data loss and cluster issues.

### **How It Works**

#### **1. Disk Thresholds**
Elasticsearch monitors disk usage and sets thresholds:

- **85% (Low Watermark)**: Warning level - continues normal operation
- **90% (High Watermark)**: Stops allocating new shards - node becomes read-only for new data
- **95% (Flood Stage)**: Emergency mode - cluster becomes read-only

#### **2. What Happens at Each Threshold**

**85% (Low Watermark):**
```bash
# Elasticsearch logs:
WARN: Disk usage is above 85% on node elasticsearch-0
# Action: Warning only, continues normal operation
```

**90% (High Watermark):**
```bash
# Elasticsearch stops:
- Allocating new shards to this node
- Creating new indices
- Accepting new data
# Action: Node becomes "read-only" for new data
```

**95% (Flood Stage):**
```bash
# Elasticsearch makes cluster read-only:
- No new writes allowed
- Only reads permitted
- Emergency mode activated
# Action: Complete write protection
```

### **Why We Disabled It**

```yaml
cluster.routing.allocation.disk.threshold_enabled: false
```

**Reasons:**
1. **Development environments** often have limited disk space
2. **Docker/KIND** containers may have disk space constraints
3. **Learning purposes** - don't want disk issues blocking experiments
4. **Demo environments** - want consistent behavior

### **Real-World Example**

**With disk checks enabled:**
```bash
# If disk is 92% full:
kubectl logs elasticsearch-0
# ERROR: Disk usage 92% exceeds high watermark 90%
# WARN: Node elasticsearch-0 will not accept new shards

# Elasticsearch becomes read-only
curl -X POST "elasticsearch:9200/test-index/_doc" -d '{"test": "data"}'
# Response: 403 Forbidden - cluster is read-only
```

**With disk checks disabled:**
```bash
# Same 92% disk usage:
# Elasticsearch continues normal operation
# No warnings or restrictions
```

### **Production vs Development**

**Production (should enable):**
```yaml
cluster.routing.allocation.disk.threshold_enabled: true
cluster.routing.allocation.disk.watermark.low: 85%
cluster.routing.allocation.disk.watermark.high: 90%
cluster.routing.allocation.disk.watermark.flood_stage: 95%
```

**Development (what we have):**
```yaml
cluster.routing.allocation.disk.threshold_enabled: false
# No disk space restrictions
```

### **Benefits of Disk Checks**

1. **Data Protection**: Prevents data loss from full disks
2. **Cluster Stability**: Maintains cluster health
3. **Early Warning**: Alerts before problems occur
4. **Automatic Recovery**: Can resume when disk space is freed

### **Risks of Disabling**

1. **Data Loss**: Could lose data if disk fills completely
2. **Cluster Crashes**: Elasticsearch might crash with no disk space
3. **No Warnings**: Won't know about disk issues until too late

**For our learning environment, disabling is fine, but in production you'd want these checks enabled-rf docs scripts*

### What is a DaemonSet?

A **DaemonSet** is a Kubernetes resource that ensures that a copy of a Pod runs on **every node** (or on selected nodes) in the cluster. Unlike Deployments which scale based on replicas, DaemonSets automatically create one Pod per node.

#### Key Characteristics:

1. **One Pod per Node**: DaemonSets ensure exactly one instance of the specified Pod runs on each node
2. **Automatic Scaling**: When nodes are added to the cluster, DaemonSets automatically create Pods on the new nodes
3. **Node-Specific Workloads**: Perfect for system-level services that need to run on every node

#### Common Use Cases:

- **Logging agents** (like Fluentd in this EFK stack)
- **Monitoring agents** (like Prometheus node-exporter)
- **Storage daemons** (like GlusterFS, Ceph)
- **Network plugins** (like Calico, Weave Net)
- **Security agents** (like Falco)

#### In This EFK Stack:

The Fluentd DaemonSet runs a logging agent on every node in the cluster to collect logs and forward them to Elasticsearch. Key features:

- **Log Collection**: Mounts host paths to collect logs from the node
- **Master Node Tolerance**: Can run on master nodes (which are usually tainted)
- **Configuration**: Uses a ConfigMap for Fluentd configuration

#### DaemonSet vs Deployment:

| Feature | DaemonSet | Deployment |
|---------|-----------|------------|
| **Scaling** | One Pod per node | Based on replica count |
| **Use Case** | System services | Application workloads |
| **Node Coverage** | Every node | Selected nodes only |
| **Scaling Behavior** | Automatic with nodes | Manual scaling |

### Do DaemonSets need services?

**DaemonSets typically don't need services** in most cases, and here's why:

#### When DaemonSets DON'T need services:

1. **Logging Agents** (like Fluentd in this EFK stack):
   - They **collect logs locally** from the node
   - They **push data out** to external systems (Elasticsearch)
   - No other components need to **connect to them**

2. **Monitoring Agents** (like Prometheus node-exporter):
   - They expose metrics on the node
   - Prometheus scrapes them directly via node IP
   - No service-to-service communication needed

3. **Storage Daemons**:
   - They manage local storage
   - Other components don't typically connect to them

#### When DaemonSets DO need services:

1. **When other components need to connect to them**:
   ```yaml
   # Example: A DaemonSet that provides an API
   apiVersion: v1
   kind: Service
   metadata:
     name: my-daemon-service
   spec:
     selector:
       app: my-daemon
     ports:
     - port: 8080
       targetPort: 8080
   ```

2. **For load balancing across nodes**:
   - If you want to distribute traffic across all DaemonSet pods

#### In This EFK Stack:

- **Fluentd DaemonSet**: ❌ No service needed (pushes to Elasticsearch)
- **Elasticsearch StatefulSet**: ✅ Has service (other components connect to it)
- **Kibana Deployment**: ✅ Has service (users access it via browser)

The Fluentd DaemonSet doesn't need a service because:
- It runs on every node collecting logs
- It pushes logs directly to Elasticsearch (which has its own service)
- No other component needs to connect to Fluentd pods

This is the typical pattern for logging and monitoring DaemonSets!

### Q: Fluentd pod is crash looping with continuous backslashes in logs

**A:** This is caused by a log feedback loop where Fluentd reads its own log files, creating an infinite parsing loop.

**Symptoms:**
- Fluentd pod shows `CrashLoopBackOff` status
- Logs contain continuous backslashes: `\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\`
- Pod gets `OOMKilled` due to memory exhaustion

**Root Cause:**
1. Fluentd reads from `/var/log/containers/*.log`
2. Fluentd writes its own logs to the same location
3. Fluentd reads its own logs again, creating a feedback loop
4. JSON parsing errors cause memory issues and crashes

**Solution:**
1. **Increase memory limits** in `daemonset.yaml`:
   ```yaml
   resources:
     limits:
       memory: 512Mi  # Increased from 200Mi
     requests:
       cpu: 100m
       memory: 256Mi  # Increased from 200Mi
   ```

2. **Exclude Fluentd's own logs** in `configmap.yaml`:
   ```yaml
   <source>
     @type tail
     path /var/log/containers/*.log
     exclude_path /var/log/containers/fluentd-*.log  # Add this line
     # ... rest of config
   </source>
   ```

3. **Optimize buffer settings** to reduce memory usage:
   ```yaml
   <buffer>
     chunk_limit_size 1M    # Reduced from 2M
     queue_limit_length 4   # Reduced from 8
     flush_interval 10s     # Increased from 5s
   </buffer>
   ```

**Apply the fix:**
```bash
kubectl apply -f efkstack/k8s/fluentd/
kubectl delete pod <fluentd-pod-name> -n efk-stack
```

**Result:** Fluentd runs stably and processes logs normally without feedback loops.

### Q: Fluentd shows "pattern not matched" warnings for different log formats

**A:** This occurs when Fluentd tries to parse non-JSON logs with a JSON parser, causing parsing failures for different log formats.

**Symptoms:**
- Fluentd logs show many "pattern not matched" warnings
- Different applications use different log formats (JSON, Go-style, etc.)
- Logs are still forwarded but with parsing errors

**Root Cause:**
- Fluentd configured with single JSON parser: `<parse> @type json </parse>`
- Kubernetes components use different log formats:
  - **etcd**: JSON format ✅ (parses successfully)
  - **kube-proxy**: Go-style format ❌ (fails to parse)
  - **kube-controller-manager**: Go-style format ❌ (fails to parse)

**Solution: Multi-Format Parser**
Replace single JSON parser with multi-format parser in `configmap.yaml`:

```yaml
<parse>
  @type multi_format
  <pattern>
    format json
    time_format %Y-%m-%dT%H:%M:%S.%NZ
  </pattern>
  <pattern>
    format /^(?<time>\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d+Z) (?<level>\w+) (?<message>.*)$/
    time_format %Y-%m-%dT%H:%M:%S.%NZ
  </pattern>
  <pattern>
    format /^(?<time>\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d+Z) (?<level>\w) (?<message>.*)$/
    time_format %Y-%m-%dT%H:%M:%S.%NZ
  </pattern>
</parse>
```

### Q: How do the regex patterns in the multi-format parser work?

**A:** The multi-format parser uses three different patterns to handle various log formats in Kubernetes.

**Pattern 1: JSON Format**
```yaml
<pattern>
  format json
  time_format %Y-%m-%dT%H:%M:%S.%NZ
</pattern>
```
**Matches:** `{"level":"info","ts":"2025-08-06T15:03:26.300798Z","msg":"finished scheduled compaction"}`
**Extracts:** All JSON fields (`level`, `ts`, `msg`, etc.)

**Pattern 2: Go-Style Logs (Word Level)**
```yaml
<pattern>
  format /^(?<time>\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d+Z) (?<level>\w+) (?<message>.*)$/
  time_format %Y-%m-%dT%H:%M:%S.%NZ
</pattern>
```
**Matches:** `I0806 15:03:27.202784       1 main.go:297] Handling node with IPs: map[172.18.0.2:{}]`
**Regex Breakdown:**
- `(?<time>\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d+Z)` - Captures timestamp as `time` field
- `(?<level>\w+)` - Captures level as `level` field (one or more word characters)
- `(?<message>.*)` - Captures everything else as `message` field

**Pattern 3: Go-Style Logs (Single Character Level)**
```yaml
<pattern>
  format /^(?<time>\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d+Z) (?<level>\w) (?<message>.*)$/
  time_format %Y-%m-%dT%H:%M:%S.%NZ
</pattern>
```
**Matches:** Same as Pattern 2, but for single-character levels
**Key Difference:** `(?<level>\w)` - Single word character instead of `\w+`

**Why Three Patterns?**
| Pattern | Purpose | Example |
|---------|---------|---------|
| **JSON** | Structured logs (etcd, Elasticsearch) | `{"level":"info","msg":"..."}` |
| **Word Level** | Go logs with multi-char levels | `INFO message` |
| **Single Char** | Go logs with single-char levels | `I message` |

**How Fluentd Processes:**
1. Tries Pattern 1 (JSON) - If matches, uses it
2. Tries Pattern 2 (Word level) - If matches, uses it  
3. Tries Pattern 3 (Single char) - If matches, uses it
4. If none match - Logs warning but still forwards the log

This ensures all log formats in Kubernetes are properly parsed and structured!