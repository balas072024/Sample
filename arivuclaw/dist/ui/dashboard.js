"use strict";
/**
 * ArivuClaw Web UI Dashboard — Serves a real-time status dashboard.
 *
 * Provides an Express HTTP server with API endpoints for system health,
 * sessions, skills, channels, memory stats, providers, and configuration.
 * The root route serves a self-contained HTML dashboard with a dark theme.
 *
 * @module ui/dashboard
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardServer = void 0;
exports.generateDashboardHTML = generateDashboardHTML;
const logger_1 = require("../utils/logger");
// ─── Dashboard HTML Generator ────────────────────────────────────────
/**
 * Generate a self-contained HTML string for the dashboard.
 * Includes inline CSS (dark theme) and JavaScript that polls the API.
 *
 * @returns Complete HTML document string.
 */
function generateDashboardHTML() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>ArivuClaw Dashboard</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
    background:#0d1117;color:#c9d1d9;min-height:100vh}
  header{background:#161b22;border-bottom:1px solid #30363d;padding:16px 24px;
    display:flex;align-items:center;justify-content:space-between}
  header h1{font-size:20px;color:#58a6ff}
  header .status{font-size:13px;color:#3fb950}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));
    gap:16px;padding:24px}
  .card{background:#161b22;border:1px solid #30363d;border-radius:8px;padding:20px}
  .card h2{font-size:14px;text-transform:uppercase;letter-spacing:1px;
    color:#8b949e;margin-bottom:12px}
  .card .value{font-size:28px;font-weight:700;color:#58a6ff}
  .card ul{list-style:none}
  .card ul li{padding:6px 0;border-bottom:1px solid #21262d;font-size:14px;
    display:flex;justify-content:space-between}
  .card ul li:last-child{border-bottom:none}
  .badge{display:inline-block;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:600}
  .badge.green{background:#23863630;color:#3fb950}
  .badge.red{background:#f8514930;color:#f85149}
  .badge.blue{background:#58a6ff30;color:#58a6ff}
  footer{text-align:center;padding:16px;color:#484f58;font-size:12px}
</style>
</head>
<body>
<header>
  <h1>ArivuClaw Dashboard</h1>
  <span class="status" id="healthStatus">Checking...</span>
</header>
<div class="grid">
  <div class="card">
    <h2>Active Sessions</h2>
    <div class="value" id="sessionCount">--</div>
    <ul id="sessionList"></ul>
  </div>
  <div class="card">
    <h2>Skills</h2>
    <div class="value" id="skillCount">--</div>
    <ul id="skillList"></ul>
  </div>
  <div class="card">
    <h2>Channels</h2>
    <ul id="channelList"></ul>
  </div>
  <div class="card">
    <h2>Memory</h2>
    <ul id="memoryStats"></ul>
  </div>
  <div class="card">
    <h2>Providers</h2>
    <ul id="providerList"></ul>
  </div>
</div>
<footer>ArivuClaw &mdash; Refreshes every 5 seconds</footer>
<script>
async function fetchJSON(url){
  try{const r=await fetch(url);return await r.json()}catch{return null}
}
async function refresh(){
  const h=await fetchJSON('/api/health');
  document.getElementById('healthStatus').textContent=h?'System Healthy':'Unreachable';

  const sessions=await fetchJSON('/api/sessions');
  if(sessions){
    document.getElementById('sessionCount').textContent=sessions.length;
    document.getElementById('sessionList').innerHTML=sessions.slice(0,5)
      .map(s=>'<li><span>'+s.id.slice(0,8)+'</span><span class="badge blue">'+s.channelType+'</span></li>').join('');
  }

  const skills=await fetchJSON('/api/skills');
  if(skills){
    document.getElementById('skillCount').textContent=skills.length;
    document.getElementById('skillList').innerHTML=skills.slice(0,8)
      .map(s=>'<li><span>'+s.name+'</span><span>v'+s.version+'</span></li>').join('');
  }

  const channels=await fetchJSON('/api/channels');
  if(channels){
    document.getElementById('channelList').innerHTML=channels
      .map(c=>'<li><span>'+c.type+'</span><span class="badge '+(c.connected?'green':'red')+'">'
        +(c.connected?'Connected':'Offline')+'</span></li>').join('');
  }

  const mem=await fetchJSON('/api/memory/stats');
  if(mem){
    document.getElementById('memoryStats').innerHTML=
      '<li><span>Entries</span><span>'+mem.totalEntries+'</span></li>'+
      '<li><span>Facts</span><span>'+mem.totalFacts+'</span></li>'+
      '<li><span>Dimensions</span><span>'+mem.vectorDimensions+'</span></li>'+
      '<li><span>Storage</span><span>'+(mem.storageSizeBytes/1024/1024).toFixed(1)+' MB</span></li>';
  }

  const providers=await fetchJSON('/api/providers');
  if(providers){
    document.getElementById('providerList').innerHTML=providers
      .map(p=>'<li><span>'+p.name+'</span><span class="badge blue">'+p.model+'</span></li>').join('');
  }
}
refresh();
setInterval(refresh,5000);
</script>
</body>
</html>`;
}
// ─── Dashboard Server ────────────────────────────────────────────────
/**
 * Express-style HTTP server for the ArivuClaw web dashboard.
 *
 * @example
 * ```ts
 * const dashboard = new DashboardServer(dataProvider, { port: 7890, host: "0.0.0.0" });
 * await dashboard.start();
 * ```
 */
class DashboardServer {
    log = logger_1.Logger.create("DashboardServer");
    config;
    data;
    routes = new Map();
    server = null;
    /**
     * Create a new DashboardServer.
     *
     * @param dataProvider - Callbacks for fetching live system data.
     * @param config - Server configuration (port, host).
     */
    constructor(dataProvider, config) {
        this.data = dataProvider;
        this.config = {
            port: config?.port ?? 7890,
            host: config?.host ?? "127.0.0.1",
        };
        this.registerRoutes();
    }
    /**
     * Start the HTTP server.
     *
     * @returns Promise that resolves once the server is listening.
     */
    async start() {
        const http = await Promise.resolve().then(() => __importStar(require("node:http")));
        this.server = http.createServer((req, res) => {
            this.handleRequest(req, res);
        });
        return new Promise((resolve) => {
            this.server.listen(this.config.port, this.config.host, () => {
                this.log.info(`Dashboard server listening on http://${this.config.host}:${this.config.port}`);
                resolve();
            });
        });
    }
    /**
     * Stop the HTTP server.
     */
    async stop() {
        if (!this.server)
            return;
        return new Promise((resolve, reject) => {
            this.server.close((err) => {
                if (err) {
                    this.log.error(`Error stopping dashboard server: ${err.message}`);
                    reject(err);
                }
                else {
                    this.log.info("Dashboard server stopped");
                    this.server = null;
                    resolve();
                }
            });
        });
    }
    /** Register all API routes. */
    registerRoutes() {
        this.routes.set("GET /", {
            method: "GET",
            handler: (_req, res) => {
                res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
                res.end(generateDashboardHTML());
            },
        });
        this.routes.set("GET /api/health", {
            method: "GET",
            handler: (_req, res) => {
                this.json(res, {
                    status: "healthy",
                    uptime: process.uptime(),
                    timestamp: new Date().toISOString(),
                });
            },
        });
        this.routes.set("GET /api/sessions", {
            method: "GET",
            handler: (_req, res) => {
                this.json(res, this.data.getSessions());
            },
        });
        this.routes.set("GET /api/skills", {
            method: "GET",
            handler: (_req, res) => {
                this.json(res, this.data.getSkills());
            },
        });
        this.routes.set("GET /api/channels", {
            method: "GET",
            handler: (_req, res) => {
                this.json(res, this.data.getChannelStatuses());
            },
        });
        this.routes.set("GET /api/memory/stats", {
            method: "GET",
            handler: (_req, res) => {
                this.json(res, this.data.getMemoryStats());
            },
        });
        this.routes.set("GET /api/providers", {
            method: "GET",
            handler: (_req, res) => {
                this.json(res, this.data.getProviders());
            },
        });
        this.routes.set("POST /api/config", {
            method: "POST",
            handler: (_req, res, body) => {
                try {
                    const patch = JSON.parse(body ?? "{}");
                    this.data.updateConfig(patch);
                    this.json(res, { success: true });
                }
                catch (error) {
                    res.writeHead(400, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({ error: "Invalid JSON body" }));
                }
            },
        });
    }
    /** Route an incoming HTTP request to the appropriate handler. */
    handleRequest(req, res) {
        const method = req.method ?? "GET";
        const url = req.url ?? "/";
        const routeKey = `${method} ${url.split("?")[0]}`;
        const route = this.routes.get(routeKey);
        if (!route) {
            res.writeHead(404, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Not found" }));
            return;
        }
        // Collect body for POST requests
        if (method === "POST") {
            let body = "";
            req.on("data", (chunk) => {
                body += chunk.toString();
            });
            req.on("end", () => {
                void route.handler(req, res, body);
            });
        }
        else {
            void route.handler(req, res);
        }
    }
    /** Write a JSON response. */
    json(res, data) {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(data));
    }
}
exports.DashboardServer = DashboardServer;
//# sourceMappingURL=dashboard.js.map