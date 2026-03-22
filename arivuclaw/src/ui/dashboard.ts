/**
 * ArivuClaw Web UI Dashboard — Serves a real-time status dashboard.
 *
 * Provides an Express HTTP server with API endpoints for system health,
 * sessions, skills, channels, memory stats, providers, and configuration.
 * The root route serves a self-contained HTML dashboard with a dark theme.
 *
 * @module ui/dashboard
 */

import type { IncomingMessage, ServerResponse } from "node:http";
import type {
  ArivuClawConfig,
  ChannelStatus,
  ProviderType,
  Session,
  SkillManifest,
} from "../core/types";
import { Logger } from "../utils/logger";

// ─── Types ───────────────────────────────────────────────────────────

/** Memory statistics exposed by the memory subsystem. */
export interface MemoryStats {
  totalEntries: number;
  totalFacts: number;
  vectorDimensions: number;
  storageSizeBytes: number;
}

/** Configuration for the dashboard server. */
export interface DashboardConfig {
  /** Port to listen on (default: 7890). */
  port: number;
  /** Hostname to bind to (default: "127.0.0.1"). */
  host: string;
}

/** Data provider callbacks the dashboard uses to fetch live data. */
export interface DashboardDataProvider {
  getSessions(): Session[];
  getSkills(): SkillManifest[];
  getChannelStatuses(): ChannelStatus[];
  getMemoryStats(): MemoryStats;
  getProviders(): { type: ProviderType; name: string; model: string }[];
  getConfig(): ArivuClawConfig;
  updateConfig(patch: Partial<ArivuClawConfig>): void;
}

/** Lightweight route handler signature. */
type RouteHandler = (
  req: IncomingMessage,
  res: ServerResponse,
  body?: string,
) => void | Promise<void>;

// ─── Dashboard HTML Generator ────────────────────────────────────────

/**
 * Generate a self-contained HTML string for the dashboard.
 * Includes inline CSS (dark theme) and JavaScript that polls the API.
 *
 * @returns Complete HTML document string.
 */
export function generateDashboardHTML(): string {
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
  .card input[type=text],.card input[type=password],.card select{
    width:100%;padding:8px 10px;margin:4px 0 8px;background:#0d1117;border:1px solid #30363d;
    border-radius:6px;color:#c9d1d9;font-size:13px;outline:none}
  .card input:focus,.card select:focus{border-color:#58a6ff}
  .card label{font-size:12px;color:#8b949e;display:block;margin-top:6px}
  .btn{padding:8px 16px;border:none;border-radius:6px;cursor:pointer;font-size:13px;font-weight:600;
    margin-top:8px;margin-right:6px}
  .btn-primary{background:#238636;color:#fff}
  .btn-primary:hover{background:#2ea043}
  .btn-danger{background:#da3633;color:#fff}
  .btn-danger:hover{background:#f85149}
  .btn-blue{background:#1f6feb;color:#fff}
  .btn-blue:hover{background:#388bfd}
  .btn:disabled{opacity:0.5;cursor:not-allowed}
  .save-msg{font-size:12px;color:#3fb950;margin-left:8px;display:none}
  .key-row{display:flex;align-items:center;gap:6px}
  .key-row input{flex:1}
  .toggle-btn{background:none;border:1px solid #30363d;color:#8b949e;padding:4px 8px;
    border-radius:4px;cursor:pointer;font-size:11px;flex-shrink:0}
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
  <div class="card" style="grid-column:1/-1">
    <h2>Settings &amp; API Keys</h2>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px">
      <div>
        <label>Provider</label>
        <select id="cfgProvider">
          <option value="anthropic">Anthropic (Claude)</option>
          <option value="openai">OpenAI (GPT)</option>
          <option value="groq">Groq (Free)</option>
          <option value="deepseek">DeepSeek (Free)</option>
          <option value="minimax">MiniMax</option>
          <option value="google">Google AI</option>
          <option value="ollama">Ollama (Local)</option>
          <option value="custom">Neural Brain</option>
        </select>
        <label>Model</label>
        <input type="text" id="cfgModel" placeholder="e.g. claude-sonnet-4-20250514"/>
      </div>
      <div>
        <label>Anthropic API Key</label>
        <div class="key-row">
          <input type="password" id="keyAnthropic" placeholder="sk-ant-..."/>
          <button class="toggle-btn" onclick="toggleKey('keyAnthropic')">Show</button>
        </div>
        <label>OpenAI API Key</label>
        <div class="key-row">
          <input type="password" id="keyOpenai" placeholder="sk-..."/>
          <button class="toggle-btn" onclick="toggleKey('keyOpenai')">Show</button>
        </div>
      </div>
      <div>
        <label>Groq API Key</label>
        <div class="key-row">
          <input type="password" id="keyGroq" placeholder="gsk_..."/>
          <button class="toggle-btn" onclick="toggleKey('keyGroq')">Show</button>
        </div>
        <label>DeepSeek API Key</label>
        <div class="key-row">
          <input type="password" id="keyDeepseek" placeholder="sk-..."/>
          <button class="toggle-btn" onclick="toggleKey('keyDeepseek')">Show</button>
        </div>
      </div>
      <div>
        <label>Google API Key</label>
        <div class="key-row">
          <input type="password" id="keyGoogle" placeholder="AIza..."/>
          <button class="toggle-btn" onclick="toggleKey('keyGoogle')">Show</button>
        </div>
        <label>MiniMax API Key</label>
        <div class="key-row">
          <input type="password" id="keyMinimax" placeholder="eyJ..."/>
          <button class="toggle-btn" onclick="toggleKey('keyMinimax')">Show</button>
        </div>
      </div>
    </div>
    <div style="margin-top:16px">
      <button class="btn btn-primary" id="btnSave" onclick="saveConfig()">Save Settings</button>
      <button class="btn btn-blue" id="btnRestart" onclick="restartGateway()">Restart Gateway</button>
      <span class="save-msg" id="saveMsg">Saved!</span>
    </div>
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
function toggleKey(id){
  const inp=document.getElementById(id);
  inp.type=inp.type==='password'?'text':'password';
  inp.nextElementSibling&&(inp.parentElement.querySelector('.toggle-btn').textContent=inp.type==='password'?'Show':'Hide');
}
async function loadConfig(){
  const cfg=await fetchJSON('/api/config');
  if(!cfg) return;
  document.getElementById('cfgProvider').value=cfg.provider||'';
  document.getElementById('cfgModel').value=cfg.model||'';
  if(cfg.apiKeys){
    if(cfg.apiKeys.anthropic) document.getElementById('keyAnthropic').value=cfg.apiKeys.anthropic;
    if(cfg.apiKeys.openai) document.getElementById('keyOpenai').value=cfg.apiKeys.openai;
    if(cfg.apiKeys.groq) document.getElementById('keyGroq').value=cfg.apiKeys.groq;
    if(cfg.apiKeys.deepseek) document.getElementById('keyDeepseek').value=cfg.apiKeys.deepseek;
    if(cfg.apiKeys.google) document.getElementById('keyGoogle').value=cfg.apiKeys.google;
    if(cfg.apiKeys.minimax) document.getElementById('keyMinimax').value=cfg.apiKeys.minimax;
  }
}
async function saveConfig(){
  const btn=document.getElementById('btnSave');
  const msg=document.getElementById('saveMsg');
  btn.disabled=true;btn.textContent='Saving...';
  try{
    const body={
      provider:document.getElementById('cfgProvider').value,
      model:document.getElementById('cfgModel').value,
      apiKeys:{
        anthropic:document.getElementById('keyAnthropic').value||undefined,
        openai:document.getElementById('keyOpenai').value||undefined,
        groq:document.getElementById('keyGroq').value||undefined,
        deepseek:document.getElementById('keyDeepseek').value||undefined,
        google:document.getElementById('keyGoogle').value||undefined,
        minimax:document.getElementById('keyMinimax').value||undefined,
      }
    };
    const r=await fetch('/api/config',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    const res=await r.json();
    if(res.success){msg.style.display='inline';msg.textContent='Saved!';setTimeout(()=>msg.style.display='none',3000)}
    else{msg.style.display='inline';msg.textContent='Error: '+(res.error||'unknown');msg.style.color='#f85149'}
  }catch(e){msg.style.display='inline';msg.textContent='Failed to save';msg.style.color='#f85149'}
  finally{btn.disabled=false;btn.textContent='Save Settings'}
}
async function restartGateway(){
  const btn=document.getElementById('btnRestart');
  btn.disabled=true;btn.textContent='Restarting...';
  try{
    await fetch('/api/restart',{method:'POST'});
    const msg=document.getElementById('saveMsg');
    msg.style.display='inline';msg.textContent='Gateway restarting...';msg.style.color='#58a6ff';
    setTimeout(()=>{msg.style.display='none';msg.style.color='#3fb950';refresh()},3000);
  }catch(e){
    const msg=document.getElementById('saveMsg');
    msg.style.display='inline';msg.textContent='Restart failed';msg.style.color='#f85149';
  }
  finally{btn.disabled=false;btn.textContent='Restart Gateway'}
}
refresh();
loadConfig();
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
export class DashboardServer {
  private readonly log = Logger.create("DashboardServer");
  private readonly config: DashboardConfig;
  private readonly data: DashboardDataProvider;
  private readonly routes = new Map<string, { method: string; handler: RouteHandler }>();
  private server: import("node:http").Server | null = null;

  /**
   * Create a new DashboardServer.
   *
   * @param dataProvider - Callbacks for fetching live system data.
   * @param config - Server configuration (port, host).
   */
  constructor(dataProvider: DashboardDataProvider, config?: Partial<DashboardConfig>) {
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
  async start(): Promise<void> {
    const http = await import("node:http");

    this.server = http.createServer((req, res) => {
      this.handleRequest(req, res);
    });

    return new Promise<void>((resolve) => {
      this.server!.listen(this.config.port, this.config.host, () => {
        this.log.info(`Dashboard server listening on http://${this.config.host}:${this.config.port}`);
        resolve();
      });
    });
  }

  /**
   * Stop the HTTP server.
   */
  async stop(): Promise<void> {
    if (!this.server) return;
    return new Promise<void>((resolve, reject) => {
      this.server!.close((err) => {
        if (err) {
          this.log.error(`Error stopping dashboard server: ${err.message}`);
          reject(err);
        } else {
          this.log.info("Dashboard server stopped");
          this.server = null;
          resolve();
        }
      });
    });
  }

  /** Register all API routes. */
  private registerRoutes(): void {
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
          const patch = JSON.parse(body ?? "{}") as Partial<ArivuClawConfig>;
          this.data.updateConfig(patch);
          this.json(res, { success: true });
        } catch (error) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Invalid JSON body" }));
        }
      },
    });
  }

  /** Route an incoming HTTP request to the appropriate handler. */
  private handleRequest(req: IncomingMessage, res: ServerResponse): void {
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
      req.on("data", (chunk: Buffer) => {
        body += chunk.toString();
      });
      req.on("end", () => {
        void route.handler(req, res, body);
      });
    } else {
      void route.handler(req, res);
    }
  }

  /** Write a JSON response. */
  private json(res: ServerResponse, data: unknown): void {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(data));
  }
}
