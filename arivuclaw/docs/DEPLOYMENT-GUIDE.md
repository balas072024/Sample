# Arivumaiyam AI — Deployment Guide

> From laptop to Kubernetes in minutes.

---

## Local Laptop (3 Commands)

The fastest way to get started:

```bash
# 1. Install
npm install -g arivuclaw

# 2. Configure (interactive wizard)
arivuclaw init

# 3. Run
arivuclaw start
```

`arivuclaw init` walks you through choosing a provider, entering API keys, and selecting which channels to enable. Config is written to `arivuclaw.config.ts` and secrets to `.env`.

### Manual Setup

```bash
git clone https://github.com/arivuclaw/arivuclaw.git
cd arivuclaw
npm install
cp .env.example .env
# Edit .env — add ANTHROPIC_API_KEY (or another provider key)
npm run build
npm start
```

### CLI Chat (no channel setup required)

```bash
arivuclaw chat
# or with a specific provider
ARIVUCLAW_PROVIDER=ollama arivuclaw chat
```

---

## Environment File

```bash
# .env
ARIVUCLAW_MODE=unrestricted
ARIVUCLAW_PORT=3000
ARIVUCLAW_LOG_LEVEL=info

# Provider (choose one or more)
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
GROQ_API_KEY=gsk_...

# Channels (add as needed)
TELEGRAM_BOT_TOKEN=...
DISCORD_BOT_TOKEN=...
SLACK_BOT_TOKEN=...
SLACK_APP_TOKEN=...
SLACK_SIGNING_SECRET=...
```

---

## Docker

### Dockerfile

```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json .
COPY --from=builder /app/skills ./skills
EXPOSE 3000
VOLUME ["/app/.arivuclaw", "/app/skills", "/app/config"]
CMD ["node", "dist/index.js"]
```

### docker-compose.yml

```yaml
version: "3.9"

services:
  arivuclaw:
    build: .
    image: arivuclaw:latest
    restart: unless-stopped
    ports:
      - "3000:3000"
      - "3001:3001"   # dashboard
      - "3002:3002"   # MCP server
    environment:
      - ARIVUCLAW_MODE=unrestricted
      - ARIVUCLAW_PORT=3000
      - NODE_ENV=production
    env_file:
      - .env
    volumes:
      - arivuclaw-data:/app/.arivuclaw
      - ./skills:/app/skills
      - ./config:/app/config
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 15s
    depends_on:
      - postgres

  postgres:
    image: pgvector/pgvector:pg16
    restart: unless-stopped
    environment:
      POSTGRES_DB: arivuclaw
      POSTGRES_USER: arivuclaw
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres-data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  arivuclaw-data:
  postgres-data:
```

### Build and run

```bash
docker compose up -d
docker compose logs -f arivuclaw
```

### Health check

```bash
curl http://localhost:3000/health
```

---

## Kubernetes

### Namespace and Secret

```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: arivuclaw
```

```bash
kubectl create secret generic arivuclaw-secrets \
  --namespace arivuclaw \
  --from-literal=ANTHROPIC_API_KEY=sk-ant-... \
  --from-literal=TELEGRAM_BOT_TOKEN=... \
  --from-literal=POSTGRES_PASSWORD=...
```

### Deployment

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: arivuclaw
  namespace: arivuclaw
spec:
  replicas: 1
  selector:
    matchLabels:
      app: arivuclaw
  template:
    metadata:
      labels:
        app: arivuclaw
    spec:
      containers:
        - name: arivuclaw
          image: ghcr.io/arivuclaw/arivuclaw:latest
          ports:
            - containerPort: 3000
            - containerPort: 3001
          env:
            - name: ARIVUCLAW_MODE
              value: "local-admin"
            - name: NODE_ENV
              value: "production"
          envFrom:
            - secretRef:
                name: arivuclaw-secrets
          resources:
            requests:
              cpu: "500m"
              memory: "512Mi"
            limits:
              cpu: "2000m"
              memory: "2Gi"
          volumeMounts:
            - name: data
              mountPath: /app/.arivuclaw
            - name: skills
              mountPath: /app/skills
          livenessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 15
            periodSeconds: 30
          readinessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 10
            periodSeconds: 10
      volumes:
        - name: data
          persistentVolumeClaim:
            claimName: arivuclaw-data
        - name: skills
          configMap:
            name: arivuclaw-skills
```

### Service and Ingress

```yaml
# k8s/service.yaml
apiVersion: v1
kind: Service
metadata:
  name: arivuclaw
  namespace: arivuclaw
spec:
  selector:
    app: arivuclaw
  ports:
    - name: gateway
      port: 3000
      targetPort: 3000
    - name: dashboard
      port: 3001
      targetPort: 3001
  type: ClusterIP
---
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: arivuclaw
  namespace: arivuclaw
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/proxy-read-timeout: "3600"
    nginx.ingress.kubernetes.io/proxy-send-timeout: "3600"
spec:
  ingressClassName: nginx
  tls:
    - hosts:
        - yourdomain.com
      secretName: arivuclaw-tls
  rules:
    - host: yourdomain.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: arivuclaw
                port:
                  number: 3000
```

```bash
kubectl apply -f k8s/
kubectl -n arivuclaw rollout status deployment/arivuclaw
```

---

## Cloud Deployments

### AWS (ECS Fargate)

```bash
# Build and push to ECR
aws ecr create-repository --repository-name arivuclaw
docker build -t arivuclaw .
docker tag arivuclaw:latest 123456789.dkr.ecr.us-east-1.amazonaws.com/arivuclaw:latest
aws ecr get-login-password | docker login --username AWS --password-stdin 123456789.dkr.ecr.us-east-1.amazonaws.com
docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/arivuclaw:latest

# Create ECS task definition (task-def.json)
# Set environment variables via AWS Secrets Manager
# Create ECS service with ALB
```

Key AWS services:
- **ECS Fargate** — containerised runtime (no EC2 management)
- **ALB** — load balancer with SSL termination
- **Secrets Manager** — API keys storage
- **EFS** — persistent volume for `.arivuclaw/` data
- **RDS (pgvector)** — optional managed PostgreSQL for vector store

### GCP (Cloud Run)

```bash
# Build and push to Artifact Registry
gcloud builds submit --tag gcr.io/YOUR_PROJECT/arivuclaw

# Deploy
gcloud run deploy arivuclaw \
  --image gcr.io/YOUR_PROJECT/arivuclaw \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 3000 \
  --memory 1Gi \
  --cpu 1 \
  --set-secrets "ANTHROPIC_API_KEY=anthropic-key:latest" \
  --set-env-vars "ARIVUCLAW_MODE=unrestricted,NODE_ENV=production"
```

Note: Cloud Run instances are stateless. Mount a Cloud Filestore NFS or use the pgvector backend for persistent memory.

### Railway

```bash
# railway.toml
[build]
  builder = "nixpacks"

[deploy]
  startCommand = "npm start"
  healthcheckPath = "/health"
  healthcheckTimeout = 30

[[services]]
  name = "arivuclaw"
```

```bash
railway login
railway init
railway up
railway variables set ANTHROPIC_API_KEY=sk-ant-...
```

Railway automatically provisions a PostgreSQL database and sets `DATABASE_URL`.

### Fly.io

```toml
# fly.toml
app = "arivuclaw"
primary_region = "iad"

[build]
  dockerfile = "Dockerfile"

[http_service]
  internal_port = 3000
  force_https = true
  auto_stop_machines = false
  auto_start_machines = true
  min_machines_running = 1

[[mounts]]
  source = "arivuclaw_data"
  destination = "/app/.arivuclaw"

[env]
  ARIVUCLAW_MODE = "unrestricted"
  NODE_ENV = "production"
```

```bash
fly launch
fly secrets set ANTHROPIC_API_KEY=sk-ant-...
fly deploy
fly logs
```

---

## Reverse Proxy (nginx)

```nginx
# /etc/nginx/sites-available/arivuclaw
upstream arivuclaw_backend {
    server 127.0.0.1:3000;
    keepalive 32;
}

server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate     /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;

    # Long timeouts for streaming responses
    proxy_read_timeout  3600;
    proxy_send_timeout  3600;
    proxy_connect_timeout 60;

    location / {
        proxy_pass http://arivuclaw_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;               # Required for SSE streaming
    }
}
```

---

## SSL / TLS

### Let's Encrypt (Certbot)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
# Auto-renewal
sudo systemctl enable certbot.timer
```

### Self-signed (development)

```bash
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes \
  -subj "/CN=localhost"
```

---

## Monitoring

### Health Endpoint

```bash
curl https://yourdomain.com/health
# Response:
{
  "status": "healthy",
  "uptime": 86400,
  "channels": { "telegram": "connected", "discord": "connected" },
  "provider": "anthropic",
  "activeSessions": 12,
  "totalUsers": 48,
  "memoryEntries": 1204
}
```

### Dashboard

Arivumaiyam AI ships a web dashboard at port `3001`:

```
http://localhost:3001
```

Displays: active sessions, message throughput, provider latency, memory usage, skill invocation counts, error rates.

### Prometheus Metrics

Expose metrics for Prometheus scraping:

```typescript
// arivuclaw.config.ts
telemetry: {
  exporters: [
    { type: "prometheus", port: 9090, path: "/metrics" },
  ],
}
```

```yaml
# prometheus.yml scrape config
scrape_configs:
  - job_name: arivuclaw
    static_configs:
      - targets: ["localhost:9090"]
```

Key metrics:
- `arivuclaw_messages_total` — counter by channel, status
- `arivuclaw_llm_latency_ms` — histogram by provider
- `arivuclaw_tool_calls_total` — counter by skill, tool
- `arivuclaw_memory_entries` — gauge
- `arivuclaw_active_sessions` — gauge

---

## Scaling

Arivumaiyam AI is designed for single-instance operation (one process per deployment). To scale:

1. **Vertical scaling** — increase CPU/memory. The AI loop is CPU-bound during embedding; LLM calls are I/O-bound.
2. **Multiple personas** — run separate Arivumaiyam AI instances for different agent personas or teams.
3. **Session affinity** — if load-balancing multiple instances, use sticky sessions (cookie or IP hash) so each user's session stays on one instance.
4. **Redis session store** — configure Redis as the session backend to share sessions across instances:

```typescript
session: {
  backend: "redis",
  redisUrl: process.env.REDIS_URL,
}
```

5. **External vector store** — use Pinecone or pgvector with a shared connection string so all instances share memory.

---

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---|---|---|
| `ECONNREFUSED localhost:11434` | Ollama not running | `ollama serve` |
| `401 Unauthorized` from provider | Invalid API key | Check `.env`, confirm key is active |
| WhatsApp QR not appearing | Terminal doesn't support QR | Use `arivuclaw whatsapp --ascii-qr` |
| Telegram bot not responding | Webhook not registered | `arivuclaw telegram setup` |
| Memory not persisting across restarts | Persistence path not writable | `chmod 755 .arivuclaw/` |
| `Skill not found: xyz` | Skill not in loaded dirs | Check `skillDirs` config, run `arivuclaw skills list` |
| High memory usage | Memory decay disabled | Set `decayRate > 0` in memory config |
| Slow first response | Cold embedding model | Pre-warm: `arivuclaw warmup` |
| Dashboard port conflict | Port 3001 in use | Set `ARIVUCLAW_DASHBOARD_PORT=3004` |
| MCP tool not appearing | MCPClient not connected | Check `mcp.clients` config, verify token |

### Debug Mode

```bash
ARIVUCLAW_LOG_LEVEL=debug arivuclaw start
```

### Check connected channels

```bash
arivuclaw status
```

### Test a skill in isolation

```bash
arivuclaw skill run calculator '{"expression": "2+2"}'
```
