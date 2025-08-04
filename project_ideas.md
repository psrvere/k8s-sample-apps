# Kubernetes Sample Projects

A curated collection of Kubernetes projects organized by difficulty level, from beginner to advanced.

---

## 🚀 Beginner Projects
*Focus: Core Objects and Basic Deployments*

These projects introduce fundamental Kubernetes primitives like pods, services, and deployments.

### 1. Hello World Deployment

**Description:** Deploy a simple "Hello World" containerized app (e.g., using a basic Node.js or Python server). Create a Deployment YAML to manage replicas and expose it via a Service.

**Key Learnings:** 
- Understand pods, deployments, services
- Basic kubectl commands like `apply`, `get`, and `describe`
- Source code available on GitHub

---

### 2. Kubernetes Pod Creation

**Description:** Define and launch a single pod running a container (e.g., an Nginx web server) using a YAML file, then interact with it via port-forwarding.

**Key Learnings:**
- Pod lifecycle
- YAML configuration
- Resource limits/requests
- Understanding the smallest deployable unit in Kubernetes

---

### 3. Guestbook Application

**Description:** Deploy a multi-tier guestbook app (frontend with Redis backend) using Deployments and Services for internal communication.

**Key Learnings:**
- Multi-container setups
- Services for discovery
- Basic networking
- Includes source code for Pulumi-based deployment

---

### 4. Kubernetes Secrets Management

**Description:** Create and inject secrets (e.g., API keys or passwords) into a pod for a sample app, using `kubectl create secret`.

**Key Learnings:**
- Secure data handling
- Environment variables
- Volumes for secrets to avoid hardcoding sensitive info

---

## 🔧 Intermediate Projects
*Focus: Scaling, Observability, and Automation*

These projects build on basics, introducing dynamic management and tools integration.

### 5. Persistent Storage with MySQL

**Description:** Set up a StatefulSet for a MySQL database with Persistent Volumes (PV) and Claims (PVC) to handle data persistence across pod restarts.

**Key Learnings:**
- Stateful applications
- PV/PVC for storage
- StatefulSets for ordered deployment
- Source code available

---

### 6. Auto-Scaling with Horizontal Pod Autoscaler (HPA)

**Description:** Deploy a CPU-intensive app (e.g., a web server) and configure HPA to automatically scale pods based on metrics like CPU usage.

**Key Learnings:**
- Resource monitoring
- Autoscaling policies
- Handling traffic spikes efficiently
- Aligns with general autoscaling practices

---

### 7. Logging with EFK Stack (Elasticsearch, Fluentd, Kibana)

**Description:** Implement centralized logging by deploying the EFK stack to collect, store, and visualize logs from cluster pods.

**Key Learnings:**
- DaemonSets for agents
- ConfigMaps for configurations
- Observability basics
- Includes GitHub source

---

### 8. Monitoring with Prometheus and Grafana

**Description:** Set up Prometheus for metrics collection and Grafana for dashboards to monitor cluster health and app performance.

**Key Learnings:**
- Service discovery
- Alerting rules
- Visualization of metrics like CPU/memory
- Source code provided
- Staple for Kubernetes monitoring

---

## 🎯 Advanced Projects
*Focus: Production-Grade Features and Complex Scenarios*

These projects involve real-world integrations, security, and multi-component systems.

### 9. CI/CD Pipeline with Jenkins

**Description:** Deploy Jenkins as a Kubernetes app and build a pipeline to automate building, testing, and deploying a sample app (e.g., Spring Boot).

**Key Learnings:**
- Helm charts for installations
- Persistent Volumes for job data
- Integrating CI/CD tools
- Source code on GitHub
- Extends to DevSecOps practices

---

### 10. Canary Deployments

**Description:** Implement a canary release strategy for a web app, routing a small percentage of traffic to a new version using Ingress or service mesh.

**Key Learnings:**
- Advanced deployment strategies
- Traffic splitting
- Rollback mechanisms for safe updates
- Includes example code

---

### 11. Microservices Deployment on EKS (or Local Cluster)

**Description:** Deploy a set of 10 interconnected microservices (e.g., user service, payment service) using Deployments, Services, and possibly Istio for mesh.

**Key Learnings:**
- Microservices architecture
- Service mesh
- Cloud-managed Kubernetes like EKS
- Adapt for local setups

---

### 12. Kubernetes Dashboard with Security Best Practices

**Description:** Deploy the official Kubernetes Dashboard, secure it with RBAC (Role-Based Access Control), and integrate network policies for isolation.

**Key Learnings:**
- Web UI management
- Security policies
- RBAC
- Network segmentation
- Clone from official repos for setup