# Guestbook Application

A multi-tier guestbook application demonstrating Kubernetes Deployments, Services, and internal communication between frontend and Redis backend.

## Overview

This comprehensive example demonstrates:
- **Multi-tier Architecture**: Frontend web application with Redis backend
- **Service Discovery**: Internal communication between components
- **Deployment Management**: Rolling updates and scaling
- **Basic Networking**: Service types and port exposure
- **State Management**: Persistent data with Redis

## Project Structure

```
guestbook/
├── app/
│   ├── app.js                    # Frontend application
│   ├── package.json              # Node.js dependencies
│   └── Dockerfile                # Frontend container image
├── k8s/
│   ├── redis-deployment.yaml     # Redis backend deployment
│   ├── redis-service.yaml        # Redis service (ClusterIP)
│   ├── frontend-deployment.yaml  # Frontend application deployment
│   ├── frontend-service.yaml     # Frontend service (NodePort)
│   └── namespace.yaml            # Application namespace
└── README.md                     # This comprehensive guide
```

## Architecture

The guestbook application consists of two main components:

1. **Frontend (Node.js)**: Web application that allows users to sign a guestbook
2. **Backend (Redis)**: In-memory database storing guestbook entries

### Communication Flow

```
User → Frontend Service → Frontend Pod → Redis Service → Redis Pod
```

## Prerequisites

- Kubernetes cluster (local or remote)
- `kubectl` configured to access your cluster
- Docker (for building images)

## Quick Start

### 1. Build and Push Images

```bash
# Build the frontend image
cd app
docker build -t psrvere/k8s-sample-app:guestbook-latest .

# Push to registry
docker push psrvere/k8s-sample-app:guestbook-latest
```

### 2. Deploy the Application

```bash
# Create namespace
kubectl apply -f k8s/namespace.yaml

# Deploy Redis backend
kubectl apply -f k8s/redis-deployment.yaml
kubectl apply -f k8s/redis-service.yaml

# Deploy frontend application
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/frontend-service.yaml
```

### 3. Check Deployment Status

```bash
# Check all resources in the guestbook namespace
kubectl get all -n guestbook

# Check pod status
kubectl get pods -n guestbook

# Check services
kubectl get services -n guestbook
```

### 3. Access the Application

```bash
# Check service details
kubectl get service frontend-service -n guestbook

# For Kind clusters (recommended): Use port-forward
kubectl port-forward service/frontend-service 3001:3000 -n guestbook
# Then access: http://localhost:3001

# For other clusters: Access via NodePort (port 30080)
# http://localhost:30080
```

**Q: What is HTTP 503 status code?**

**A:** 503 Service Unavailable - Server is temporarily unable to handle the request, usually due to maintenance, overload, or service dependency issues. In our guestbook app, it's returned when Redis is down.

**Q: What are Redis lPush and lTrim operations?**

**A:** 
- **lPush**: Adds element to the left (beginning) of a list
- **lTrim**: Trims list to keep only specified range (0-99 = first 100 elements)
- **In our app**: Newest entries appear first, oldest get removed when limit exceeded.

**Q: What is Redis lRange operation?**

**A:** 
- **lRange**: Retrieves elements from a list within specified range
- **lRange('key', 0, -1)**: Gets all elements (0 = start, -1 = end)
- **In our app**: Retrieves all guestbook entries for display

**Q: Why is .dockerignore file required?**

**A:** 
- **Speed up builds** - Excludes unnecessary files from Docker build context
- **Reduce image size** - Prevents copying unwanted files into the image
- **Security** - Excludes sensitive files (.env, .git)
- **Efficiency** - Skips files that aren't needed in the container (node_modules, dist, logs)

**Q: Why doesn't NodePort work in Kind clusters?**

**A:** 
- **Kind limitation**: NodePort services don't automatically bind to host network
- **NodePort 30080**: Not accessible via localhost or node IP
- **Solution**: Use port-forward instead
- **Command**: `kubectl port-forward service/frontend-service 3001:3000 -n guestbook`
- **Access**: http://localhost:3001
- **Note**: Kind clusters run in Docker containers, so NodePort behavior differs from real clusters
