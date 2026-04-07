# Cloudflare Tunnel Setup for Arivu Ecosystem

Run all 10 apps from your laptop and expose them via Cloudflare Tunnel.

## Prerequisites

1. [Cloudflare account](https://dash.cloudflare.com/sign-up)
2. A domain added to Cloudflare
3. [cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/) installed

## Quick Start (Single App)

```bash
# Start any app locally
cd family-hub && npm start  # runs on port 3000

# In another terminal, expose via Cloudflare
cloudflared tunnel --url http://localhost:3000
```

This gives you a temporary `https://xxx.trycloudflare.com` URL.

## Production Setup (All Apps)

### 1. Create a Cloudflare Tunnel

```bash
cloudflared tunnel login
cloudflared tunnel create arivu-ecosystem
```

### 2. Configure DNS (add these in Cloudflare Dashboard or via CLI)

```bash
cloudflared tunnel route dns arivu-ecosystem family.yourdomain.com
cloudflared tunnel route dns arivu-ecosystem watch.yourdomain.com
cloudflared tunnel route dns arivu-ecosystem vault.yourdomain.com
cloudflared tunnel route dns arivu-ecosystem astro.yourdomain.com
cloudflared tunnel route dns arivu-ecosystem ops.yourdomain.com
cloudflared tunnel route dns arivu-ecosystem shift.yourdomain.com
cloudflared tunnel route dns arivu-ecosystem gateway.yourdomain.com
cloudflared tunnel route dns arivu-ecosystem brain.yourdomain.com
cloudflared tunnel route dns arivu-ecosystem mobile.yourdomain.com
cloudflared tunnel route dns arivu-ecosystem claw.yourdomain.com
```

### 3. Create config file `~/.cloudflared/config.yml`

```yaml
tunnel: arivu-ecosystem
credentials-file: ~/.cloudflared/<TUNNEL-UUID>.json

ingress:
  - hostname: family.yourdomain.com
    service: http://localhost:3000
  - hostname: watch.yourdomain.com
    service: http://localhost:9000
  - hostname: vault.yourdomain.com
    service: http://localhost:4100
  - hostname: astro.yourdomain.com
    service: http://localhost:5000
  - hostname: ops.yourdomain.com
    service: http://localhost:3001
  - hostname: shift.yourdomain.com
    service: http://localhost:4000
  - hostname: gateway.yourdomain.com
    service: http://localhost:5013
  - hostname: brain.yourdomain.com
    service: http://localhost:8200
  - hostname: mobile.yourdomain.com
    service: http://localhost:5050
  - hostname: claw.yourdomain.com
    service: http://localhost:18789
  - service: http_status:404
```

### 4. Start all apps, then run the tunnel

```bash
# Start all apps (use the START-ALL script or docker-compose)
./start-all.sh

# Start the tunnel
cloudflared tunnel run arivu-ecosystem
```

## Port Map

| App | Port | URL |
|-----|------|-----|
| Family Hub | 3000 | family.yourdomain.com |
| ArivuWatch | 9000 | watch.yourdomain.com |
| Vault Browser | 4100 | vault.yourdomain.com |
| Valluvan Astrologer | 5000 | astro.yourdomain.com |
| OpsWatch Unified | 3001 | ops.yourdomain.com |
| OpsShiftPro | 4000 | shift.yourdomain.com |
| Kaashmikhaa Gateway | 5013 | gateway.yourdomain.com |
| Neural Brain API | 8200 | brain.yourdomain.com |
| Arivu Mobile | 5050 | mobile.yourdomain.com |
| ClawArivu | 18789 | claw.yourdomain.com |

## WebSocket Support

Cloudflare supports WebSocket proxying automatically. Family Hub's real-time chat uses WebSocket at `/ws` — this works through Cloudflare Tunnel without any extra configuration. The frontend auto-detects `wss://` when served over HTTPS.

## Cloudflare Settings

In your Cloudflare Dashboard:
- **SSL/TLS**: Full (strict)
- **WebSockets**: Enabled (default on all plans)
- **Always Use HTTPS**: ON
- **Caching**: Standard (static assets cached, API requests pass through)

## Health Checks

All apps expose `/api/health` without authentication for Cloudflare health monitoring.
