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
│   ├── namespace.yaml  # Kubernetes namespace
│   ├── deployment.yaml # Kubernetes deployment
│   ├── service.yaml    # Kubernetes ClusterIP service
│   └── service_nodeport.yaml # Kubernetes NodePort service
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
   # Create the namespace first
   kubectl apply -f k8s/namespace.yaml
   
   # Deploy the application
   kubectl apply -f k8s/deployment.yaml
   
   # Choose your service type:
   # Option 1: ClusterIP service (internal access only)
   kubectl apply -f k8s/service.yaml
   
   # Option 2: NodePort service (external access via NodePort)
   kubectl apply -f k8s/service_nodeport.yaml
   ```

4. Check deployment status:
   ```bash
   kubectl get pods -n helloworld
   kubectl get services -n helloworld
   ```

5. Access the application:
   ```bash
   # Option 1: Port forward to service (simplified)
   kubectl port-forward service/helloworld-service 8080:3000 -n helloworld
   
   # Option 2: Direct port forward to deployment (even simpler)
   kubectl port-forward deployment/helloworld-app 8080:3000 -n helloworld
   
   # Option 3: NodePort service (no port-forwarding needed)
   # If you deployed the NodePort service, access directly at:
   # http://localhost:30080
   ```
   
   Then visit `http://localhost:8080` (port-forward) or `http://localhost:30080` (NodePort)

## Kubernetes Resources

### Namespace
- **Name**: `helloworld`
- **Purpose**: Isolates all application resources in a dedicated namespace
- **Benefits**: 
  - Resource organization and isolation
  - Easier cleanup and management
  - Prevents naming conflicts with other applications

### Deployment
- **Replicas**: 3 (for high availability)
- **Resource Limits**: 128Mi memory, 100m CPU
- **Resource Requests**: 64Mi memory, 50m CPU
- **Health Checks**: Liveness and readiness probes

### Services

#### ClusterIP Service (`service.yaml`)
- **Type**: ClusterIP (internal access)
- **Port**: 3000 (external) → 3000 (container) - simplified!
- **Access**: Requires port-forwarding

#### NodePort Service (`service_nodeport.yaml`)
- **Type**: NodePort (external access)
- **Port**: 3000 (external) → 3000 (container)
- **NodePort**: 30080 (accessible at http://localhost:30080)
- **Access**: Direct access without port-forwarding

## API Endpoints

- `GET /` - Main Hello World response
- `GET /health` - Health check endpoint

## Monitoring and Debugging

```bash
# View pod logs
kubectl logs -l app=helloworld-app -n helloworld

# Describe deployment
kubectl describe deployment helloworld-app -n helloworld

# Check service endpoints
kubectl get endpoints helloworld-service -n helloworld
```

## Scaling

Scale the deployment:
```bash
kubectl scale deployment helloworld-app --replicas=5 -n helloworld
```

## Cleanup

Remove the deployment:
```bash
kubectl delete -f k8s/
```

Or delete the entire namespace (which removes all resources):
```bash
kubectl delete namespace helloworld
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

### Q: Why did we choose 30080 for NodePort?

**A:** The NodePort selection follows Kubernetes conventions and best practices:

**Kubernetes NodePort Range:** `30000-32767`

**Our Choice:** `30080 = 30000 + 80`
- **30000:** Base of NodePort range
- **80:** Standard HTTP port
- **30080:** Easy to remember and logical

**Other Common Examples:**
| Service Type | Internal Port | NodePort | Reasoning |
|--------------|---------------|----------|-----------|
| HTTP | 80 | 30080 | 30000 + 80 |
| HTTPS | 443 | 30443 | 30000 + 443 |
| MySQL | 3306 | 33306 | 30000 + 3306 |
| Redis | 6379 | 36379 | 30000 + 6379 |

**What to Avoid:**
- ❌ **1-1023:** Privileged ports (require root)
- ❌ **1024-29999:** Reserved for other services
- ❌ **32768+:** Outside NodePort range

**Alternative for your app:** `33000` (30000 + 3000) would also work, but 30080 is more standard for HTTP services.