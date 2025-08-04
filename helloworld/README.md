# Hello World Kubernetes Application

A simple "Hello World" containerized Node.js application designed for Kubernetes deployment.

## Application Features

- Express.js web server
- Health check endpoint (`/health`)
- JSON response with timestamp and pod information
- Kubernetes-ready with proper probes and resource limits

## Project Structure

```
helloworld/
├── app.js              # Main application file
├── package.json        # Node.js dependencies
├── Dockerfile          # Container configuration
├── .dockerignore       # Docker build exclusions
├── k8s/
│   ├── deployment.yaml # Kubernetes deployment
│   └── service.yaml    # Kubernetes service
└── README.md          # This file
```

## Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the application locally:
   ```bash
   npm start
   ```

3. Access the application at `http://localhost:3000`

## Docker Build

1. Build the Docker image:
   ```bash
   docker build -t helloworld-app:latest .
   ```

2. Run the container locally:
   ```bash
   docker run -p 3000:3000 helloworld-app:latest
   ```

## Kubernetes Deployment

### Prerequisites

- Kubernetes cluster (local or remote)
- `kubectl` configured to access your cluster

### Deployment Steps

1. Build and push the Docker image to your registry:
   ```bash
   # Build the image
   docker build -t helloworld-app:latest .
   
   # Tag for your registry (replace with your registry)
   docker tag helloworld-app:latest your-registry/helloworld-app:latest
   
   # Push to registry
   docker push your-registry/helloworld-app:latest
   ```

2. Update the image reference in `k8s/deployment.yaml`:
   ```yaml
   image: your-registry/helloworld-app:latest
   ```

3. Deploy to Kubernetes:
   ```bash
   kubectl apply -f k8s/deployment.yaml
   kubectl apply -f k8s/service.yaml
   ```

4. Check deployment status:
   ```bash
   kubectl get pods
   kubectl get services
   ```

5. Access the application:
   ```bash
   # Option 1: Port forward to service (simplified)
   kubectl port-forward service/helloworld-service 8080:3000
   
   # Option 2: Direct port forward to deployment (even simpler)
   kubectl port-forward deployment/helloworld-app 8080:3000
   ```
   
   Then visit `http://localhost:8080`

## Kubernetes Resources

### Deployment
- **Replicas**: 3 (for high availability)
- **Resource Limits**: 128Mi memory, 100m CPU
- **Resource Requests**: 64Mi memory, 50m CPU
- **Health Checks**: Liveness and readiness probes

### Service
- **Type**: ClusterIP (internal access)
- **Port**: 3000 (external) → 3000 (container) - simplified!

## API Endpoints

- `GET /` - Main Hello World response
- `GET /health` - Health check endpoint

## Monitoring and Debugging

```bash
# View pod logs
kubectl logs -l app=helloworld-app

# Describe deployment
kubectl describe deployment helloworld-app

# Check service endpoints
kubectl get endpoints helloworld-service
```

## Scaling

Scale the deployment:
```bash
kubectl scale deployment helloworld-app --replicas=5
```

## Cleanup

Remove the deployment:
```bash
kubectl delete -f k8s/
```

### Q: Why did we change the service port from 80 to 3000?

**A:** We simplified the port mapping to make it more logical and easier to understand.

**Original Complex Setup:**
```
Container (3000) → Service (80) → Port Forward (8080) → Local Machine
```

**Simplified Setup:**
```
Container (3000) → Service (3000) → Port Forward (8080) → Local Machine
```

### Q:What was the original setup?

**A:** The original setup followed traditional Kubernetes patterns:

1. **Standard Web Ports:** Services typically use port 80 (HTTP) and 443 (HTTPS)
2. **Load Balancer Compatibility:** External load balancers expect standard ports
3. **Multiple Services:** When you have many services, using standard ports helps with routing

### Q: When should I use port 80 vs port 3000 for services?

**A:** It depends on your use case:

**Use Port 80/443 when:**
- ✅ Production environments with external load balancers
- ✅ Multiple services that need standard HTTP/HTTPS ports
- ✅ When you want to hide the actual application port from external users

**Use Port 3000 (or app-specific ports) when:**
- ✅ Development and testing environments
- ✅ Simple applications with direct access
- ✅ When you want to keep port mapping logical and straightforward

### Q: What are the different ways to access the application?

**A:** Here are the options, from simplest to most complex:

1. **Direct Port Forward (Simplest):**
   ```bash
   kubectl port-forward deployment/helloworld-app 8080:3000
   ```

2. **Service Port Forward (Current):**
   ```bash
   kubectl port-forward service/helloworld-service 8080:3000
   ```

3. **NodePort Service:**
   ```yaml
   type: NodePort
   ports:
   - port: 3000
     nodePort: 30080
   ```
   Then access via `http://localhost:30080`

4. **LoadBalancer Service (Cloud):**
   ```yaml
   type: LoadBalancer
   ```
   Gets external IP automatically

### Q: Why do we need a service at all?

**A:** Services provide several benefits:

- **Load Balancing:** Routes traffic across multiple pods
- **Service Discovery:** Other pods can find your app by service name
- **Stable Endpoints:** Pods can restart but service IP stays the same
- **Network Policies:** Can apply security rules to service traffic

For simple local development, you could skip the service and use direct port-forwarding, but services are essential for production deployments.