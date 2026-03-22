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
<title>ArivuClaw — Command Center</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet"/>
<style>
  :root{--bg:#060a10;--bg2:#0c1017;--bg3:#121820;--border:#1a2030;--border2:#252d3d;
    --text:#c9d1d9;--text2:#8b949e;--text3:#484f58;--accent:#ff6b35;--accent2:#ff8c5a;
    --green:#3fb950;--red:#f85149;--blue:#58a6ff;--purple:#bc8cff;--yellow:#d29922;--cyan:#39d2c0}
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
    background:var(--bg);color:var(--text);min-height:100vh;display:flex}

  /* Sidebar */
  .sidebar{width:240px;background:#0d1117;border-right:1px solid #1b2028;
    padding:0;display:flex;flex-direction:column;position:fixed;height:100vh;z-index:10}
  .sidebar .logo{padding:20px;border-bottom:1px solid #1b2028;text-align:center}
  .sidebar .logo h1{font-size:18px;color:#ff6b35;letter-spacing:1px}
  .sidebar .logo span{font-size:11px;color:#484f58;display:block;margin-top:4px}
  .sidebar nav{flex:1;padding:12px 0}
  .sidebar nav a{display:flex;align-items:center;gap:10px;padding:10px 20px;color:#8b949e;
    text-decoration:none;font-size:13px;transition:all .2s;border-left:3px solid transparent}
  .sidebar nav a:hover,.sidebar nav a.active{color:#c9d1d9;background:#161b22;border-left-color:#ff6b35}
  .sidebar nav a .icon{font-size:16px;width:20px;text-align:center}
  .sidebar .footer{padding:16px 20px;border-top:1px solid #1b2028;font-size:11px;color:#484f58}

  /* Main content */
  .main{margin-left:240px;flex:1;min-height:100vh}

  /* Top bar */
  .topbar{background:#0d1117;border-bottom:1px solid #1b2028;padding:12px 24px;
    display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:5}
  .topbar .left{display:flex;align-items:center;gap:12px}
  .topbar .status-dot{width:8px;height:8px;border-radius:50%;display:inline-block}
  .topbar .status-dot.green{background:#3fb950;box-shadow:0 0 6px #3fb950}
  .topbar .status-dot.red{background:#f85149;box-shadow:0 0 6px #f85149}
  .topbar .status-text{font-size:13px;color:#8b949e}
  .topbar .actions{display:flex;gap:8px}
  .topbar .actions button{background:#21262d;border:1px solid #30363d;color:#c9d1d9;
    padding:6px 14px;border-radius:6px;cursor:pointer;font-size:12px;transition:all .2s}
  .topbar .actions button:hover{background:#30363d}
  .topbar .actions button.danger{border-color:#f8514950;color:#f85149}
  .topbar .actions button.danger:hover{background:#f8514920}
  .topbar .actions button.primary{background:#ff6b35;border-color:#ff6b35;color:#fff}
  .topbar .actions button.primary:hover{background:#e55a25}

  /* Page content */
  .page{display:none;padding:24px}
  .page.active{display:block}

  /* Stats row */
  .stats-row{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:24px}
  .stat-card{background:#0d1117;border:1px solid #1b2028;border-radius:10px;padding:20px}
  .stat-card .label{font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#484f58;margin-bottom:8px}
  .stat-card .value{font-size:32px;font-weight:700;color:#ff6b35}
  .stat-card .sub{font-size:12px;color:#8b949e;margin-top:4px}

  /* Cards grid */
  .cards-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(380px,1fr));gap:16px}
  .card{background:#0d1117;border:1px solid #1b2028;border-radius:10px;padding:20px;overflow:hidden}
  .card h2{font-size:13px;text-transform:uppercase;letter-spacing:1px;color:#484f58;
    margin-bottom:16px;display:flex;align-items:center;justify-content:space-between}
  .card h2 .count{background:#ff6b3520;color:#ff6b35;padding:2px 8px;border-radius:10px;font-size:11px}

  /* Table */
  table{width:100%;border-collapse:collapse}
  th{text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:1px;
    color:#484f58;padding:8px 0;border-bottom:1px solid #1b2028}
  td{padding:8px 0;font-size:13px;border-bottom:1px solid #1b202850}
  tr:last-child td{border-bottom:none}
  .truncate{max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}

  /* Badges */
  .badge{display:inline-block;padding:2px 10px;border-radius:12px;font-size:11px;font-weight:600}
  .badge.green{background:#3fb95020;color:#3fb950}
  .badge.red{background:#f8514920;color:#f85149}
  .badge.orange{background:#ff6b3520;color:#ff6b35}
  .badge.blue{background:#58a6ff20;color:#58a6ff}
  .badge.purple{background:#bc8cff20;color:#bc8cff}
  .badge.yellow{background:#d2992220;color:#d29922}

  /* Config form */
  .config-group{margin-bottom:24px}
  .config-group h3{font-size:14px;color:#c9d1d9;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid #1b2028}
  .config-row{display:flex;align-items:center;justify-content:space-between;padding:10px 0;
    border-bottom:1px solid #1b202830}
  .config-row .key{font-size:13px;color:#8b949e;min-width:180px}
  .config-row .val{font-size:13px;color:#c9d1d9;font-family:monospace}
  .config-row input,.config-row select{background:#161b22;border:1px solid #30363d;
    color:#c9d1d9;padding:6px 10px;border-radius:6px;font-size:13px;min-width:220px}
  .config-row input:focus,.config-row select:focus{outline:none;border-color:#ff6b35}

  /* Logs */
  .log-container{background:#0a0e14;border:1px solid #1b2028;border-radius:8px;
    padding:16px;max-height:500px;overflow-y:auto;font-family:'Fira Code',monospace;font-size:12px}
  .log-line{padding:2px 0;display:flex;gap:8px}
  .log-line .ts{color:#484f58;min-width:90px}
  .log-line .lvl{min-width:50px;font-weight:600}
  .log-line .lvl.info{color:#58a6ff}
  .log-line .lvl.warn{color:#d29922}
  .log-line .lvl.error{color:#f85149}
  .log-line .msg{color:#8b949e}

  /* Skills page */
  .skill-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px}
  .skill-item{background:#161b22;border:1px solid #1b2028;border-radius:8px;padding:14px;
    transition:border-color .2s}
  .skill-item:hover{border-color:#30363d}
  .skill-item .name{font-size:14px;font-weight:600;color:#c9d1d9}
  .skill-item .desc{font-size:12px;color:#8b949e;margin-top:4px}
  .skill-item .meta{display:flex;gap:8px;margin-top:8px}

  /* Search */
  .search-bar{background:#161b22;border:1px solid #1b2028;border-radius:8px;padding:8px 14px;
    color:#c9d1d9;width:100%;font-size:13px;margin-bottom:16px}
  .search-bar:focus{outline:none;border-color:#ff6b35}

  /* Toast */
  .toast{position:fixed;bottom:24px;right:24px;background:#161b22;border:1px solid #30363d;
    border-radius:8px;padding:12px 20px;color:#c9d1d9;font-size:13px;z-index:100;
    transform:translateY(100px);opacity:0;transition:all .3s}
  .toast.show{transform:translateY(0);opacity:1}
  .toast.success{border-color:#3fb950}
  .toast.error{border-color:#f85149}

  /* Responsive */
  @media(max-width:768px){
    .sidebar{display:none}
    .main{margin-left:0}
    .stats-row{grid-template-columns:repeat(2,1fr)}
    .cards-grid{grid-template-columns:1fr}
  }
</style>
</head>
<body>

<!-- Sidebar -->
<div class="sidebar">
  <div class="logo">
    <h1>ArivuClaw</h1>
    <span>v1.0.0 | Unrestricted</span>
  </div>
  <nav>
    <a href="#" class="active" data-page="overview"><span class="icon">&#9776;</span> Overview</a>
    <a href="#" data-page="channels"><span class="icon">&#128225;</span> Channels</a>
    <a href="#" data-page="skills"><span class="icon">&#9881;</span> Skills</a>
    <a href="#" data-page="config"><span class="icon">&#9879;</span> Configuration</a>
    <a href="#" data-page="logs"><span class="icon">&#128196;</span> Logs</a>
  </nav>
  <div class="footer">Port 6799 | Dashboard 6800</div>
</div>

<!-- Main -->
<div class="main">

  <!-- Top bar -->
  <div class="topbar">
    <div class="left">
      <span class="status-dot green" id="statusDot"></span>
      <span class="status-text" id="statusText">Connecting...</span>
      <span style="color:#484f58;font-size:12px" id="uptimeText"></span>
    </div>
    <div class="actions">
      <button onclick="restartGateway()">Restart Gateway</button>
      <button class="danger" onclick="if(confirm('Stop ArivuClaw?'))fetch('/api/restart',{method:'POST'})">Stop</button>
    </div>
  </div>

  <!-- Overview Page -->
  <div class="page active" id="page-overview">
    <div class="stats-row">
      <div class="stat-card">
        <div class="label">Channels</div>
        <div class="value" id="statChannels">--</div>
        <div class="sub" id="statChannelsSub">Loading...</div>
      </div>
      <div class="stat-card">
        <div class="label">Skills Loaded</div>
        <div class="value" id="statSkills">--</div>
        <div class="sub" id="statSkillsSub">Loading...</div>
      </div>
      <div class="stat-card">
        <div class="label">Sessions</div>
        <div class="value" id="statSessions">--</div>
        <div class="sub">Active conversations</div>
      </div>
      <div class="stat-card">
        <div class="label">Memory</div>
        <div class="value" id="statMemory">--</div>
        <div class="sub" id="statMemorySub">Entries stored</div>
      </div>
    </div>

    <div class="cards-grid">
      <div class="card">
        <h2>Channels <span class="count" id="channelCount">0</span></h2>
        <table>
          <thead><tr><th>Channel</th><th>Status</th></tr></thead>
          <tbody id="channelTable"></tbody>
        </table>
      </div>
      <div class="card">
        <h2>Provider <span class="count" id="providerBadge">-</span></h2>
        <table>
          <thead><tr><th>Provider</th><th>Model</th></tr></thead>
          <tbody id="providerTable"></tbody>
        </table>
      </div>
      <div class="card">
        <h2>Recent Skills <span class="count" id="skillBadge">0</span></h2>
        <table>
          <thead><tr><th>Skill</th><th>Version</th><th>Tools</th></tr></thead>
          <tbody id="skillTable"></tbody>
        </table>
      </div>
      <div class="card">
        <h2>Memory Stats</h2>
        <table>
          <thead><tr><th>Metric</th><th>Value</th></tr></thead>
          <tbody id="memoryTable"></tbody>
        </table>
      </div>
    </div>
  </div>

  <!-- Channels Page -->
  <div class="page" id="page-channels">
    <h2 style="margin-bottom:16px;color:#c9d1d9">Channel Management</h2>
    <div class="cards-grid" id="channelCards"></div>
  </div>

  <!-- Skills Page -->
  <div class="page" id="page-skills">
    <input class="search-bar" id="skillSearch" placeholder="Search skills..." oninput="filterSkills()"/>
    <div class="skill-grid" id="skillGrid"></div>
  </div>

  <!-- Config Page -->
  <div class="page" id="page-config">
    <h2 style="margin-bottom:16px;color:#c9d1d9">System Configuration</h2>
    <div id="configPanel"></div>
  </div>

  <!-- Logs Page -->
  <div class="page" id="page-logs">
    <h2 style="margin-bottom:16px;color:#c9d1d9;display:flex;justify-content:space-between">
      System Logs
      <button onclick="document.getElementById('logBox').innerHTML=''" style="background:#21262d;border:1px solid #30363d;color:#8b949e;padding:4px 12px;border-radius:6px;cursor:pointer;font-size:12px">Clear</button>
    </h2>
    <div class="log-container" id="logBox">
      <div class="log-line"><span class="ts">--:--:--</span><span class="lvl info">INFO</span><span class="msg">Dashboard connected. Logs will appear here.</span></div>
    </div>
  </div>

</div>

<!-- Toast -->
<div class="toast" id="toast"></div>

<script>
// State
let allSkills = [];
let logLines = [];

// Navigation
document.querySelectorAll('.sidebar nav a').forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault();
    document.querySelectorAll('.sidebar nav a').forEach(x => x.classList.remove('active'));
    document.querySelectorAll('.page').forEach(x => x.classList.remove('active'));
    a.classList.add('active');
    document.getElementById('page-' + a.dataset.page).classList.add('active');
  });
});

// API helper
async function api(url) {
  try { const r = await fetch(url); return await r.json(); } catch { return null; }
}

// Toast
function showToast(msg, type='success') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show ' + type;
  setTimeout(() => t.className = 'toast', 3000);
}

// Restart
async function restartGateway() {
  if (!confirm('Restart ArivuClaw Gateway?')) return;
  try {
    await fetch('/api/restart', { method: 'POST' });
    showToast('Gateway restarting...');
  } catch { showToast('Restart failed', 'error'); }
}

// Format uptime
function fmtUptime(s) {
  const h = Math.floor(s/3600), m = Math.floor((s%3600)/60), sec = Math.floor(s%60);
  return (h>0?h+'h ':'') + m+'m ' + sec+'s';
}

// Add log
function addLog(level, msg) {
  const now = new Date().toLocaleTimeString();
  const box = document.getElementById('logBox');
  box.innerHTML += '<div class="log-line"><span class="ts">'+now+'</span><span class="lvl '+level+'">'+level.toUpperCase()+'</span><span class="msg">'+msg+'</span></div>';
  box.scrollTop = box.scrollHeight;
}

// Main refresh
async function refresh() {
  // Health
  const h = await api('/api/health');
  const dot = document.getElementById('statusDot');
  const txt = document.getElementById('statusText');
  if (h && h.running !== false) {
    dot.className = 'status-dot green';
    txt.textContent = 'System Healthy';
    if (h.uptime) document.getElementById('uptimeText').textContent = 'Uptime: ' + fmtUptime(h.uptime || process.uptime && process.uptime() || 0);
  } else {
    dot.className = 'status-dot red';
    txt.textContent = 'Unreachable';
  }

  // Channels
  const channels = await api('/api/channels');
  if (channels) {
    const connected = channels.filter(c => c.connected).length;
    document.getElementById('statChannels').textContent = connected + '/' + channels.length;
    document.getElementById('statChannelsSub').textContent = connected + ' connected';
    document.getElementById('channelCount').textContent = channels.length;
    document.getElementById('channelTable').innerHTML = channels.map(c =>
      '<tr><td>' + c.type + '</td><td><span class="badge ' + (c.connected?'green':'red') + '">' +
      (c.connected?'Connected':'Offline') + '</span></td></tr>'
    ).join('');

    // Channel cards
    document.getElementById('channelCards').innerHTML = channels.map(c => {
      const icons = {cli:'&#128187;',web:'&#127760;',telegram:'&#9992;',discord:'&#128172;',slack:'&#128172;',whatsapp:'&#128172;'};
      return '<div class="card"><h2>' + (icons[c.type]||'&#128225;') + ' ' + c.type +
        ' <span class="badge ' + (c.connected?'green':'red') + '">' + (c.connected?'Connected':'Offline') + '</span></h2>' +
        '<div style="margin-top:12px"><div class="config-row"><span class="key">Status</span><span class="val">' +
        (c.connected?'Active and receiving messages':'Not connected') + '</span></div></div></div>';
    }).join('');
  }

  // Skills
  const skills = await api('/api/skills');
  if (skills) {
    allSkills = skills;
    const totalTools = skills.reduce((a,s) => a + (s.tools||0), 0);
    document.getElementById('statSkills').textContent = skills.length;
    document.getElementById('statSkillsSub').textContent = totalTools + ' tools available';
    document.getElementById('skillBadge').textContent = skills.length;
    document.getElementById('skillTable').innerHTML = skills.slice(0,10).map(s =>
      '<tr><td>' + s.name + '</td><td class="badge blue">v' + s.version + '</td><td>' + (s.tools||0) + '</td></tr>'
    ).join('');
    renderSkillGrid(skills);
  }

  // Sessions
  const sessions = await api('/api/sessions');
  if (sessions) {
    document.getElementById('statSessions').textContent = sessions.length;
  }

  // Memory
  const mem = await api('/api/memory/stats');
  if (mem) {
    document.getElementById('statMemory').textContent = mem.totalEntries || 0;
    document.getElementById('memoryTable').innerHTML =
      '<tr><td>Entries</td><td>' + (mem.totalEntries||0) + '</td></tr>' +
      '<tr><td>Facts</td><td>' + (mem.totalFacts||0) + '</td></tr>' +
      '<tr><td>Dimensions</td><td>' + (mem.vectorDimensions||0) + '</td></tr>' +
      '<tr><td>Storage</td><td>' + ((mem.storageSizeBytes||0)/1024/1024).toFixed(2) + ' MB</td></tr>';
  }

  // Providers
  const providers = await api('/api/providers');
  if (providers) {
    document.getElementById('providerBadge').textContent = providers.length;
    document.getElementById('providerTable').innerHTML = providers.map(p =>
      '<tr><td><span class="badge purple">' + p.name + '</span></td><td>' + p.model + '</td></tr>'
    ).join('');
  }

  // Config
  const config = await api('/api/config');
  if (config && !document.getElementById('cfgProvider')) {
    const models = {
      anthropic: ['claude-sonnet-4-6','claude-opus-4-6','claude-haiku-4-5-20251001'],
      openai: ['gpt-4o','gpt-4o-mini','gpt-4-turbo','o1-preview'],
      google: ['gemini-2.0-flash','gemini-2.5-pro','gemini-2.5-flash'],
      ollama: ['llama3.1','llama3.2','mistral','codellama','deepseek-coder'],
      groq: ['llama-3.3-70b-versatile','mixtral-8x7b-32768','gemma2-9b-it'],
      deepseek: ['deepseek-chat','deepseek-coder','deepseek-reasoner'],
      minimax: ['MiniMax-M2','MiniMax-M1'],
      'neural-brain': ['neural-brain-hybrid'],
    };
    const providerOpts = Object.keys(models).map(p =>
      '<option value="'+p+'"'+(p===config.provider?' selected':'')+'>'+p+'</option>'
    ).join('');
    const modelOpts = (models[config.provider]||[]).map(m =>
      '<option value="'+m+'"'+(m===config.model?' selected':'')+'>'+m+'</option>'
    ).join('');

    // Find telegram channel
    const tgCh = (config.channels||[]).find(c => c.type==='telegram');
    const tgToken = tgCh?.credentials?.botToken || '';
    const tgEnabled = tgCh?.enabled ? 'checked' : '';

    // Find discord channel
    const dcCh = (config.channels||[]).find(c => c.type==='discord');
    const dcToken = dcCh?.credentials?.botToken || '';
    const dcEnabled = dcCh?.enabled ? 'checked' : '';

    document.getElementById('configPanel').innerHTML =
      '<div class="config-group"><h3>AI Provider & Model</h3>' +
      '<div class="config-row"><span class="key">Provider</span><select id="cfgProvider" onchange="onProviderChange()">'+providerOpts+'</select></div>' +
      '<div class="config-row"><span class="key">Model</span><select id="cfgModel">'+modelOpts+'</select></div>' +
      '</div>' +

      '<div class="config-group"><h3>Telegram</h3>' +
      '<div class="config-row"><span class="key">Enabled</span><input type="checkbox" id="cfgTgEnabled" '+tgEnabled+' style="min-width:auto;width:18px;height:18px"/></div>' +
      '<div class="config-row"><span class="key">Bot Token</span><input type="password" id="cfgTgToken" value="'+tgToken+'" placeholder="Enter Telegram Bot Token"/></div>' +
      '</div>' +

      '<div class="config-group"><h3>Discord</h3>' +
      '<div class="config-row"><span class="key">Enabled</span><input type="checkbox" id="cfgDcEnabled" '+dcEnabled+' style="min-width:auto;width:18px;height:18px"/></div>' +
      '<div class="config-row"><span class="key">Bot Token</span><input type="password" id="cfgDcToken" value="'+dcToken+'" placeholder="Enter Discord Bot Token"/></div>' +
      '</div>' +

      '<div class="config-group"><h3>System</h3>' +
      '<div class="config-row"><span class="key">Mode</span><span class="val badge orange">' + (config.mode||'unrestricted').toUpperCase() + '</span></div>' +
      '<div class="config-row"><span class="key">Web Port</span><span class="val">6799</span></div>' +
      '<div class="config-row"><span class="key">Dashboard Port</span><span class="val">6800</span></div>' +
      '</div>' +

      '<div style="margin-top:20px;display:flex;gap:12px">' +
      '<button onclick="saveConfig()" style="background:#ff6b35;border:1px solid #ff6b35;color:#fff;padding:10px 28px;border-radius:6px;cursor:pointer;font-size:14px;font-weight:600">Save Configuration</button>' +
      '<button onclick="refresh()" style="background:#21262d;border:1px solid #30363d;color:#c9d1d9;padding:10px 20px;border-radius:6px;cursor:pointer;font-size:13px">Reset</button>' +
      '</div>';

    // Store models map globally for provider change
    window._models = models;
  }
}

// Skill grid render
function renderSkillGrid(skills) {
  document.getElementById('skillGrid').innerHTML = skills.map(s =>
    '<div class="skill-item"><div class="name">' + s.name + '</div>' +
    '<div class="desc">' + (s.description||'No description') + '</div>' +
    '<div class="meta"><span class="badge blue">v' + s.version + '</span>' +
    '<span class="badge orange">' + (s.tools||0) + ' tools</span>' +
    (s.loaded!==false?'<span class="badge green">Loaded</span>':'<span class="badge red">Failed</span>') +
    '</div></div>'
  ).join('');
}

// Filter skills
function filterSkills() {
  const q = document.getElementById('skillSearch').value.toLowerCase();
  const filtered = allSkills.filter(s => s.name.toLowerCase().includes(q) || (s.description||'').toLowerCase().includes(q));
  renderSkillGrid(filtered);
}

// Provider change — update model dropdown
function onProviderChange() {
  const provider = document.getElementById('cfgProvider').value;
  const modelSelect = document.getElementById('cfgModel');
  const models = window._models[provider] || [];
  modelSelect.innerHTML = models.map(m => '<option value="'+m+'">'+m+'</option>').join('');
}

// Save config
async function saveConfig() {
  const provider = document.getElementById('cfgProvider')?.value;
  const model = document.getElementById('cfgModel')?.value;
  const tgEnabled = document.getElementById('cfgTgEnabled')?.checked;
  const tgToken = document.getElementById('cfgTgToken')?.value;
  const dcEnabled = document.getElementById('cfgDcEnabled')?.checked;
  const dcToken = document.getElementById('cfgDcToken')?.value;

  const payload = {
    defaultProvider: provider,
    defaultModel: model,
    channels: [
      { type: 'telegram', enabled: tgEnabled, credentials: { botToken: tgToken } },
      { type: 'discord', enabled: dcEnabled, credentials: { botToken: dcToken } },
    ]
  };

  try {
    const r = await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await r.json();
    if (data.success) {
      showToast('Configuration saved! Restart to apply changes.');
      addLog('info', 'Config saved: provider=' + provider + ', model=' + model);
    } else {
      showToast('Save failed: ' + (data.error || 'Unknown error'), 'error');
    }
  } catch (err) {
    showToast('Save failed: ' + err.message, 'error');
  }
}

// Start
refresh();
setInterval(refresh, 5000);
addLog('info', 'Dashboard initialized');
addLog('info', 'Auto-refresh every 5 seconds');
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