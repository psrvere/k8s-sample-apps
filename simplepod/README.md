# Simple Pod - Nginx Web Server

A simple Kubernetes pod running an Nginx web server container, demonstrating basic pod management and port-forwarding.

## Overview

This comprehensive example demonstrates:
- **Healthy Pod Operations**: Define and manage a working Nginx pod
- **Failure Scenarios**: Common pod failure modes and how to diagnose them
- **Troubleshooting**: Complete debugging workflow for pod issues
- **Port-Forwarding**: Access pods directly from your local machine

## Project Structure

```
simplepod/
├── pod.yaml                           # Working pod example
├── pod-image-pull-error.yaml          # Image pull failure
├── pod-crash-loop.yaml                # Application crash
├── pod-oom-killed.yaml                # Memory exhaustion
├── pod-liveness-failure.yaml          # Health check failure
├── pod-pending.yaml                   # Scheduling issues
├── pod-config-error.yaml              # Configuration errors
└── README.md                          # This comprehensive guide
```

## Prerequisites

- Kubernetes cluster (local or remote)
- `kubectl` configured to access your cluster

## Quick Start

### 1. Deploy the Pod

```bash
# Apply the pod configuration
kubectl apply -f pod.yaml
```

### 2. Check Pod Status

```bash
# Check if the pod is running
kubectl get pods

# Get detailed information about the pod
kubectl describe pod nginx-pod

# Check pod logs
kubectl logs nginx-pod
```

### 3. Access the Pod via Port-Forwarding

```bash
# Forward local port 8080 to pod port 80
kubectl port-forward nginx-pod 8080:80
```

### 4. Access the Web Server

Open your browser and navigate to:
- `http://localhost:8080`

You should see the default Nginx welcome page.

## Pod Configuration Details

The `pod.yaml` file defines:

- **Pod Name**: `nginx-pod`
- **Container**: Nginx Alpine image (`nginx:alpine`)
- **Port**: 80 (standard HTTP port)
- **Resource Limits**: 
  - Memory: 128Mi maximum
  - CPU: 100m maximum
- **Health Checks**:
  - Liveness probe: Checks `/` endpoint every 10 seconds
  - Readiness probe: Checks `/` endpoint every 5 seconds

## Useful Commands

### Pod Management

```bash
# Get pod status
kubectl get pods

# Get detailed pod information
kubectl describe pod nginx-pod

# View pod logs
kubectl logs nginx-pod

# Execute commands in the pod
kubectl exec -it nginx-pod -- /bin/sh

# Delete the pod
kubectl delete pod nginx-pod
```

### Port-Forwarding

```bash
# Forward to different local port
kubectl port-forward nginx-pod 9000:80

# Forward in background
kubectl port-forward nginx-pod 8080:80 &
```

### Monitoring

```bash
# Watch pod status changes
kubectl get pods -w

# Get pod events
kubectl get events --sort-by='.lastTimestamp'
```

## Troubleshooting

### Pod Not Starting

```bash
# Check pod events
kubectl describe pod nginx-pod

# Check if image can be pulled
kubectl describe pod nginx-pod | grep -A 10 "Events:"
```

### Port-Forwarding Issues

```bash
# Check if port is already in use
lsof -i :8080

# Use different local port
kubectl port-forward nginx-pod 8081:80
```

### Access Issues

```bash
# Test connectivity from within the pod
kubectl exec nginx-pod -- curl -I http://localhost:80

# Check if Nginx is running inside the pod
kubectl exec nginx-pod -- ps aux
```

## Cleanup

```bash
# Delete the pod
kubectl delete -f pod.yaml

# Or delete by name
kubectl delete pod nginx-pod
```

## Next Steps

After mastering this simple pod example, you can explore:

1. **Services**: Create a Service to expose the pod
2. **Deployments**: Use Deployments for better pod management
3. **ConfigMaps**: Add configuration files to the pod
4. **Volumes**: Add persistent storage
5. **Multi-container Pods**: Run multiple containers in one pod

## Key Concepts Demonstrated

- **Pod**: The smallest deployable unit in Kubernetes
- **Container**: The Nginx web server running inside the pod
- **Port-Forwarding**: Direct access to pod ports from your local machine
- **Health Probes**: Kubernetes monitoring of pod health
- **Resource Limits**: Controlling pod resource usage

## Failure Scenarios and Troubleshooting

This section covers common pod failure scenarios and how to diagnose and fix them.

### 1. Image Pull Error (`pod-image-pull-error.yaml`)

**Symptoms:**
- Pod status: `ImagePullBackOff` or `ErrImagePull`
- Container status: `Waiting` with reason `ImagePullBackOff`

**Diagnosis:**
```bash
kubectl describe pod nginx-pod-image-error
kubectl get events --sort-by='.lastTimestamp'
```

**Common Causes:**
- Invalid image name or tag
- Private registry without authentication
- Network connectivity issues
- Registry authentication problems

**Solutions:**
```bash
# Check if image exists
docker pull nginx:invalid-tag-that-does-not-exist

# Use a valid image
kubectl patch pod nginx-pod-image-error -p '{"spec":{"containers":[{"name":"nginx","image":"nginx:alpine"}]}}'
```

### 2. Crash Loop BackOff (`pod-crash-loop.yaml`)

**Symptoms:**
- Pod status: `CrashLoopBackOff`
- Container restarts repeatedly
- Exit code 1 or other non-zero codes

**Diagnosis:**
```bash
kubectl describe pod nginx-pod-crash-loop
kubectl logs nginx-pod-crash-loop --previous
kubectl logs nginx-pod-crash-loop
```

**Common Causes:**
- Application crashes on startup
- Missing dependencies
- Configuration errors
- Permission issues

**Solutions:**
```bash
# Check application logs
kubectl logs nginx-pod-crash-loop

# Execute into the pod to debug
kubectl exec -it nginx-pod-crash-loop -- /bin/sh

# Fix the command to not exit
kubectl patch pod nginx-pod-crash-loop -p '{"spec":{"containers":[{"name":"nginx","command":["nginx"],"args":["-g","daemon off;"]}]}}'
```

### Q: What's the difference between `kubectl logs` and `kubectl logs --previous`?

**A:** `--previous` shows logs from the previous crashed container instance.

**Example:**
```bash
$ kubectl logs nginx-pod-crash-loop --previous
Pod will crash in 5 seconds

$ kubectl logs nginx-pod-crash-loop
Pod will crash in 5 seconds
```

**Why same output?** Both containers run identical commands, so logs are identical.

**When useful:** When containers have different behavior between restarts or when debugging crashes.

### 3. Out of Memory (OOM) Killed (`pod-oom-killed.yaml`)

**Symptoms:**
- Pod status: `OOMKilled`
- Container terminated due to memory limit
- Memory usage exceeds limits

**Diagnosis:**
```bash
kubectl describe pod nginx-pod-oom
kubectl get events --sort-by='.lastTimestamp' | grep OOM
```

**Common Causes:**
- Memory leak in application
- Insufficient memory limits
- Memory-intensive operations

**Solutions:**
```bash
# Increase memory limits
kubectl patch pod nginx-pod-oom -p '{"spec":{"containers":[{"name":"nginx","resources":{"limits":{"memory":"512Mi"}}}]}}'

# Or fix the application to not consume excessive memory
kubectl patch pod nginx-pod-oom -p '{"spec":{"containers":[{"name":"nginx","command":["nginx"],"args":["-g","daemon off;"]}]}}'
```

### 4. Liveness Probe Failure (`pod-liveness-failure.yaml`)

**Symptoms:**
- Pod status: `Running` but restarts frequently
- Liveness probe failures in events
- Container restarts due to probe failures

**Diagnosis:**
```bash
kubectl describe pod nginx-pod-liveness-failure
kubectl get events --sort-by='.lastTimestamp' | grep probe
```

**Common Causes:**
- Application not responding on expected endpoint
- Incorrect probe configuration
- Application startup issues

**Solutions:**
```bash
# Fix the probe path
kubectl patch pod nginx-pod-liveness-failure -p '{"spec":{"containers":[{"name":"nginx","livenessProbe":{"httpGet":{"path":"/"}}}]}}'

# Or disable liveness probe temporarily
kubectl patch pod nginx-pod-liveness-failure -p '{"spec":{"containers":[{"name":"nginx","livenessProbe":null}]}}'
```

### 5. Pending State (`pod-pending.yaml`)

**Symptoms:**
- Pod status: `Pending`
- No nodes available for scheduling
- Insufficient resources

**Diagnosis:**
```bash
kubectl describe pod nginx-pod-pending
kubectl get nodes
kubectl describe nodes
```

**Common Causes:**
- Insufficient cluster resources
- Node selectors not matching
- Taints preventing scheduling
- Resource quotas exceeded

**Solutions:**
```bash
# Reduce resource requests
kubectl patch pod nginx-pod-pending -p '{"spec":{"containers":[{"name":"nginx","resources":{"requests":{"memory":"64Mi","cpu":"50m"}}}]}}'

# Check node capacity
kubectl top nodes
kubectl describe nodes
```

### 6. Configuration Error (`pod-config-error.yaml`)

**Symptoms:**
- Pod creation fails with validation error
- YAML syntax errors
- Invalid field values

**Diagnosis:**
```bash
kubectl apply -f pod-config-error.yaml
kubectl get events --sort-by='.lastTimestamp'
```

**Common Causes:**
- Invalid YAML syntax
- Unknown fields in spec
- Invalid field values
- Missing required fields

**Solutions:**
```bash
# Validate YAML before applying
kubectl apply -f pod-config-error.yaml --dry-run=client

# Fix the invalid configuration
kubectl patch pod nginx-pod-config-error -p '{"spec":{"containers":[{"name":"nginx","env":[{"name":"NGINX_HOST","value":"localhost"},{"name":"NGINX_PORT","value":"80"}]}]}}'
```

## Testing Failure Scenarios

### Test Different Failure Modes

```bash
# Image pull error
kubectl apply -f pod-image-pull-error.yaml

# Crash loop backoff
kubectl apply -f pod-crash-loop.yaml

# Out of memory killed
kubectl apply -f pod-oom-killed.yaml

# Liveness probe failure
kubectl apply -f pod-liveness-failure.yaml

# Pending state (insufficient resources)
kubectl apply -f pod-pending.yaml

# Configuration error
kubectl apply -f pod-config-error.yaml
```

### Monitor Failures

```bash
# Watch pod status changes
kubectl get pods -w

# Check specific pod details
kubectl describe pod <pod-name>

# View pod logs
kubectl logs <pod-name>

# Check cluster events
kubectl get events --sort-by='.lastTimestamp'
```

### Cleanup Failure Scenarios

```bash
# Clean up after testing
kubectl delete -f <pod-failure-file>.yaml
```

## General Troubleshooting Commands

### Check Pod Status
```bash
kubectl get pods
kubectl get pods -o wide
kubectl describe pod <pod-name>
```

### Check Events
```bash
kubectl get events --sort-by='.lastTimestamp'
kubectl get events --field-selector involvedObject.name=<pod-name>
```

### Check Logs
```bash
kubectl logs <pod-name>
kubectl logs <pod-name> --previous
kubectl logs <pod-name> -f
```

### Debug Pod
```bash
kubectl exec -it <pod-name> -- /bin/sh
kubectl exec <pod-name> -- ps aux
kubectl exec <pod-name> -- netstat -tlnp
```

### Check Resources
```bash
kubectl top pods
kubectl top nodes
kubectl describe nodes
```

## Quick Reference for Common Issues

| Issue | Status | Command to Check | Common Fix |
|-------|--------|------------------|------------|
| Image Pull Error | `ImagePullBackOff` | `kubectl describe pod` | Use valid image |
| Crash Loop | `CrashLoopBackOff` | `kubectl logs --previous` | Fix application |
| OOM Killed | `OOMKilled` | `kubectl describe pod` | Increase memory limits |
| Probe Failure | `Running` (restarts) | `kubectl describe pod` | Fix probe path |
| Pending | `Pending` | `kubectl describe pod` | Reduce resource requests |
| Config Error | Validation error | `kubectl apply --dry-run` | Fix YAML syntax |

### Q: Why do I see different pod statuses in watch mode vs regular mode?

**A:** This is due to Kubernetes' CrashLoopBackOff mechanism with exponential backoff timing.

**Watch Mode (Real-time):**
```bash
$ kubectl get pods --watch
NAME                   READY   STATUS    RESTARTS      AGE
nginx-pod-crash-loop   1/1     Running   2 (14s ago)   35s
nginx-pod-crash-loop   0/1     Error     2 (17s ago)   38s
nginx-pod-crash-loop   0/1     CrashLoopBackOff   2 (11s ago)   49s
nginx-pod-crash-loop   1/1     Running            3 (28s ago)   66s
nginx-pod-crash-loop   0/1     Error              3 (33s ago)   71s
```

**Regular Mode (Snapshot):**
```bash
$ kubectl get pods
NAME                   READY   STATUS   RESTARTS      AGE
nginx-pod-crash-loop   0/1     Error    3 (35s ago)   77s
```

**Explanation:**
- **Watch mode** shows real-time state transitions
- **Regular mode** shows current state snapshot
- **CrashLoopBackOff** = Kubernetes waiting before next restart attempt
- Pod cycles: Running → Error → CrashLoopBackOff → Running → Error...