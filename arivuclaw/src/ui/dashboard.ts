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
:root{--bg:#0d1117;--bg2:#161b22;--bg3:#1c2129;--border:#30363d;--border2:#21262d;
  --text:#c9d1d9;--text2:#8b949e;--text3:#484f58;--accent:#58a6ff;--green:#3fb950;
  --red:#f85149;--yellow:#d29922;--purple:#bc8cff;--sidebar-w:220px}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
  background:var(--bg);color:var(--text);min-height:100vh;display:flex}

/* Sidebar */
.sidebar{width:var(--sidebar-w);background:var(--bg2);border-right:1px solid var(--border);
  display:flex;flex-direction:column;position:fixed;top:0;left:0;bottom:0;z-index:10;
  transition:width .2s}
.sidebar .logo{padding:20px 16px;border-bottom:1px solid var(--border);display:flex;
  align-items:center;gap:10px}
.sidebar .logo h1{font-size:16px;color:var(--accent);font-weight:700;white-space:nowrap}
.sidebar .logo .icon{font-size:22px}
.sidebar nav{flex:1;padding:8px 0}
.sidebar nav a{display:flex;align-items:center;gap:10px;padding:10px 16px;color:var(--text2);
  text-decoration:none;font-size:13px;font-weight:500;border-left:3px solid transparent;
  transition:all .15s}
.sidebar nav a:hover{background:var(--bg3);color:var(--text)}
.sidebar nav a.active{background:var(--bg3);color:var(--accent);border-left-color:var(--accent)}
.sidebar nav a .nav-icon{font-size:16px;width:20px;text-align:center}
.sidebar .sidebar-footer{padding:12px 16px;border-top:1px solid var(--border);font-size:11px;color:var(--text3)}

/* Main */
.main{margin-left:var(--sidebar-w);flex:1;min-height:100vh;display:flex;flex-direction:column}
.topbar{background:var(--bg2);border-bottom:1px solid var(--border);padding:12px 24px;
  display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:5}
.topbar .health{display:flex;align-items:center;gap:8px;font-size:13px}
.topbar .health .dot{width:8px;height:8px;border-radius:50%;display:inline-block}
.topbar .health .dot.ok{background:var(--green);box-shadow:0 0 6px var(--green)}
.topbar .health .dot.err{background:var(--red);box-shadow:0 0 6px var(--red)}
.topbar .uptime{font-size:12px;color:var(--text2)}
.content{padding:24px;flex:1}
.page{display:none}
.page.active{display:block}

/* Metric Cards */
.metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:24px}
.metric{background:var(--bg2);border:1px solid var(--border);border-radius:10px;padding:20px;
  transition:border-color .2s}
.metric:hover{border-color:var(--accent)}
.metric .metric-icon{font-size:24px;margin-bottom:8px}
.metric .metric-val{font-size:32px;font-weight:700;color:var(--accent)}
.metric .metric-label{font-size:12px;color:var(--text2);margin-top:4px;text-transform:uppercase;letter-spacing:.5px}

/* Cards */
.card-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:16px;margin-bottom:24px}
.card{background:var(--bg2);border:1px solid var(--border);border-radius:10px;padding:20px;
  transition:border-color .2s}
.card:hover{border-color:var(--border2)}
.card h3{font-size:13px;text-transform:uppercase;letter-spacing:.8px;color:var(--text2);
  margin-bottom:14px;display:flex;align-items:center;gap:8px}
.card ul{list-style:none}
.card li{padding:8px 0;border-bottom:1px solid var(--border2);font-size:13px;
  display:flex;justify-content:space-between;align-items:center}
.card li:last-child{border-bottom:none}
.badge{display:inline-block;padding:2px 10px;border-radius:12px;font-size:11px;font-weight:600}
.badge.green{background:#23863630;color:var(--green)}
.badge.red{background:#f8514930;color:var(--red)}
.badge.yellow{background:#d2992230;color:var(--yellow)}
.badge.blue{background:#58a6ff20;color:var(--accent)}
.badge.purple{background:#bc8cff20;color:var(--purple)}

/* Activity Log */
.log-box{background:var(--bg);border:1px solid var(--border);border-radius:8px;
  max-height:220px;overflow-y:auto;padding:12px;font-family:'SF Mono',Monaco,Consolas,monospace;font-size:12px}
.log-box .log-entry{padding:3px 0;color:var(--text2);border-bottom:1px solid var(--border2)}
.log-box .log-entry:last-child{border-bottom:none}
.log-box .log-time{color:var(--text3);margin-right:8px}
.log-box .log-ok{color:var(--green)}
.log-box .log-warn{color:var(--yellow)}
.log-box .log-err{color:var(--red)}

/* Settings */
.tabs{display:flex;gap:0;border-bottom:1px solid var(--border);margin-bottom:20px}
.tab{padding:10px 20px;font-size:13px;color:var(--text2);cursor:pointer;border-bottom:2px solid transparent;
  background:none;border-top:none;border-left:none;border-right:none;font-weight:500;transition:all .15s}
.tab:hover{color:var(--text)}
.tab.active{color:var(--accent);border-bottom-color:var(--accent)}
.tab-content{display:none}
.tab-content.active{display:block}
.form-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:20px}
.form-group{margin-bottom:16px}
.form-group label{font-size:12px;color:var(--text2);display:block;margin-bottom:6px;font-weight:500}
.form-group input,.form-group select{width:100%;padding:9px 12px;background:var(--bg);
  border:1px solid var(--border);border-radius:6px;color:var(--text);font-size:13px;outline:none;
  transition:border-color .15s}
.form-group input:focus,.form-group select:focus{border-color:var(--accent)}
.key-row{display:flex;gap:6px}
.key-row input{flex:1}
.toggle-vis{background:var(--bg3);border:1px solid var(--border);color:var(--text2);padding:9px 12px;
  border-radius:6px;cursor:pointer;font-size:11px;white-space:nowrap;transition:all .15s}
.toggle-vis:hover{border-color:var(--accent);color:var(--text)}
.btn-row{margin-top:24px;display:flex;gap:10px;align-items:center}
.btn{padding:10px 20px;border:none;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600;
  transition:all .15s}
.btn-green{background:#238636;color:#fff}
.btn-green:hover{background:#2ea043}
.btn-blue{background:#1f6feb;color:#fff}
.btn-blue:hover{background:#388bfd}
.btn-red{background:#da3633;color:#fff}
.btn-red:hover{background:#f85149}
.btn:disabled{opacity:.5;cursor:not-allowed}
.toast{font-size:12px;padding:6px 14px;border-radius:6px;display:none;font-weight:500}
.toast.ok{background:#23863630;color:var(--green);display:inline-block}
.toast.err{background:#f8514930;color:var(--red);display:inline-block}
.toast.info{background:#58a6ff20;color:var(--accent);display:inline-block}

/* Responsive */
@media(max-width:900px){
  .metrics{grid-template-columns:repeat(2,1fr)}
  .card-grid{grid-template-columns:1fr}
  .form-grid{grid-template-columns:1fr}
}
@media(max-width:640px){
  .sidebar{width:56px}
  .sidebar .logo h1,.sidebar nav a span:not(.nav-icon),.sidebar .sidebar-footer{display:none}
  .sidebar .logo{justify-content:center;padding:16px 8px}
  .sidebar nav a{justify-content:center;padding:12px 8px}
  .main{margin-left:56px}
  .metrics{grid-template-columns:1fr 1fr}
}
</style>
</head>
<body>

<!-- Sidebar -->
<aside class="sidebar">
  <div class="logo"><span class="icon">&#129408;</span><h1>ArivuClaw</h1></div>
  <nav>
    <a href="#" class="active" data-page="dashboard"><span class="nav-icon">&#9707;</span><span>Dashboard</span></a>
    <a href="#" data-page="channels"><span class="nav-icon">&#128225;</span><span>Channels</span></a>
    <a href="#" data-page="skills"><span class="nav-icon">&#9889;</span><span>Skills</span></a>
    <a href="#" data-page="memory"><span class="nav-icon">&#129504;</span><span>Memory</span></a>
    <a href="#" data-page="settings"><span class="nav-icon">&#9881;</span><span>Settings</span></a>
  </nav>
  <div class="sidebar-footer">v1.0.0</div>
</aside>

<!-- Main Content -->
<div class="main">
  <div class="topbar">
    <div class="health"><span class="dot" id="healthDot"></span><span id="healthText">Checking...</span></div>
    <div class="uptime" id="uptimeText"></div>
  </div>
  <div class="content">

    <!-- Dashboard Page -->
    <div class="page active" id="page-dashboard">
      <div class="metrics">
        <div class="metric"><div class="metric-icon">&#128101;</div><div class="metric-val" id="mSessions">--</div><div class="metric-label">Sessions</div></div>
        <div class="metric"><div class="metric-icon">&#128225;</div><div class="metric-val" id="mChannels">--</div><div class="metric-label">Channels</div></div>
        <div class="metric"><div class="metric-icon">&#9889;</div><div class="metric-val" id="mSkills">--</div><div class="metric-label">Skills</div></div>
        <div class="metric"><div class="metric-icon">&#129504;</div><div class="metric-val" id="mMemory">--</div><div class="metric-label">Memory Entries</div></div>
      </div>
      <div class="card-grid">
        <div class="card"><h3>&#128225; Channels</h3><ul id="dChannels"><li>Loading...</li></ul></div>
        <div class="card"><h3>&#127899; Active Provider</h3><ul id="dProviders"><li>Loading...</li></ul></div>
      </div>
      <div class="card" style="margin-top:0"><h3>&#128220; Activity Log</h3>
        <div class="log-box" id="logBox"><div class="log-entry"><span class="log-time">--:--:--</span>Initializing...</div></div>
      </div>
    </div>

    <!-- Channels Page -->
    <div class="page" id="page-channels">
      <h2 style="font-size:18px;margin-bottom:16px;color:var(--accent)">Channel Status</h2>
      <div class="card"><ul id="chFullList"><li>Loading...</li></ul></div>
    </div>

    <!-- Skills Page -->
    <div class="page" id="page-skills">
      <h2 style="font-size:18px;margin-bottom:16px;color:var(--accent)">Installed Skills</h2>
      <div class="card"><ul id="skFullList"><li>Loading...</li></ul></div>
    </div>

    <!-- Memory Page -->
    <div class="page" id="page-memory">
      <h2 style="font-size:18px;margin-bottom:16px;color:var(--accent)">Memory Store</h2>
      <div class="metrics" style="grid-template-columns:repeat(4,1fr)">
        <div class="metric"><div class="metric-val" id="memEntries">--</div><div class="metric-label">Entries</div></div>
        <div class="metric"><div class="metric-val" id="memFacts">--</div><div class="metric-label">Facts</div></div>
        <div class="metric"><div class="metric-val" id="memDims">--</div><div class="metric-label">Dimensions</div></div>
        <div class="metric"><div class="metric-val" id="memSize">--</div><div class="metric-label">Storage</div></div>
      </div>
    </div>

    <!-- Settings Page -->
    <div class="page" id="page-settings">
      <h2 style="font-size:18px;margin-bottom:16px;color:var(--accent)">Settings</h2>
      <div class="tabs">
        <button class="tab active" data-tab="tab-provider">Provider</button>
        <button class="tab" data-tab="tab-keys">API Keys</button>
        <button class="tab" data-tab="tab-channels">Channels</button>
      </div>

      <!-- Provider Tab -->
      <div class="tab-content active" id="tab-provider">
        <div class="form-grid">
          <div>
            <div class="form-group"><label>Default Provider</label>
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
            </div>
            <div class="form-group"><label>Model</label>
              <input type="text" id="cfgModel" placeholder="e.g. claude-sonnet-4-20250514"/>
            </div>
          </div>
          <div>
            <div class="form-group"><label>Ollama Base URL</label>
              <input type="text" id="cfgOllamaUrl" placeholder="http://localhost:11434"/>
            </div>
            <div class="form-group"><label>Execution Mode</label>
              <select id="cfgMode">
                <option value="unrestricted">Unrestricted</option>
                <option value="local-admin">Local Admin</option>
                <option value="restricted">Restricted</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- API Keys Tab -->
      <div class="tab-content" id="tab-keys">
        <div class="form-grid">
          <div>
            <div class="form-group"><label>Anthropic API Key</label>
              <div class="key-row"><input type="password" id="keyAnthropic" placeholder="sk-ant-..."/>
              <button class="toggle-vis" onclick="togVis('keyAnthropic',this)">Show</button></div>
            </div>
            <div class="form-group"><label>OpenAI API Key</label>
              <div class="key-row"><input type="password" id="keyOpenai" placeholder="sk-..."/>
              <button class="toggle-vis" onclick="togVis('keyOpenai',this)">Show</button></div>
            </div>
            <div class="form-group"><label>Google API Key</label>
              <div class="key-row"><input type="password" id="keyGoogle" placeholder="AIza..."/>
              <button class="toggle-vis" onclick="togVis('keyGoogle',this)">Show</button></div>
            </div>
          </div>
          <div>
            <div class="form-group"><label>Groq API Key</label>
              <div class="key-row"><input type="password" id="keyGroq" placeholder="gsk_..."/>
              <button class="toggle-vis" onclick="togVis('keyGroq',this)">Show</button></div>
            </div>
            <div class="form-group"><label>DeepSeek API Key</label>
              <div class="key-row"><input type="password" id="keyDeepseek" placeholder="sk-..."/>
              <button class="toggle-vis" onclick="togVis('keyDeepseek',this)">Show</button></div>
            </div>
            <div class="form-group"><label>MiniMax API Key</label>
              <div class="key-row"><input type="password" id="keyMinimax" placeholder="eyJ..."/>
              <button class="toggle-vis" onclick="togVis('keyMinimax',this)">Show</button></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Channels Tab -->
      <div class="tab-content" id="tab-channels">
        <div class="form-grid">
          <div>
            <div class="form-group"><label>Telegram Bot Token</label>
              <div class="key-row"><input type="password" id="tokTelegram" placeholder="123456:ABC-DEF..."/>
              <button class="toggle-vis" onclick="togVis('tokTelegram',this)">Show</button></div>
            </div>
            <div class="form-group"><label>Discord Bot Token</label>
              <div class="key-row"><input type="password" id="tokDiscord" placeholder="MTk..."/>
              <button class="toggle-vis" onclick="togVis('tokDiscord',this)">Show</button></div>
            </div>
          </div>
          <div>
            <div class="form-group"><label>Slack Bot Token</label>
              <div class="key-row"><input type="password" id="tokSlack" placeholder="xoxb-..."/>
              <button class="toggle-vis" onclick="togVis('tokSlack',this)">Show</button></div>
            </div>
            <div class="form-group"><label>WhatsApp Auth Token</label>
              <div class="key-row"><input type="password" id="tokWhatsapp" placeholder="EAAx..."/>
              <button class="toggle-vis" onclick="togVis('tokWhatsapp',this)">Show</button></div>
            </div>
          </div>
        </div>
      </div>

      <div class="btn-row">
        <button class="btn btn-green" id="btnSave" onclick="saveConfig()">Save Settings</button>
        <button class="btn btn-blue" id="btnRestart" onclick="restartGW()">Restart Gateway</button>
        <span class="toast" id="toast"></span>
      </div>
    </div>

  </div><!-- /content -->
</div><!-- /main -->

<script>
const $=id=>document.getElementById(id);
async function api(url){try{const r=await fetch(url);return await r.json()}catch{return null}}
let logEntries=[];
function addLog(msg,cls){
  const t=new Date().toLocaleTimeString();
  logEntries.push({t,msg,cls});
  if(logEntries.length>50)logEntries.shift();
  const box=$('logBox');
  if(box)box.innerHTML=logEntries.map(e=>'<div class="log-entry"><span class="log-time">'+e.t+'</span><span class="'+(e.cls||'')+'">'+e.msg+'</span></div>').join('');
  if(box)box.scrollTop=box.scrollHeight;
}
function fmtUptime(s){const h=Math.floor(s/3600),m=Math.floor((s%3600)/60),sec=Math.floor(s%60);return h+'h '+m+'m '+sec+'s'}

// Navigation
document.querySelectorAll('.sidebar nav a').forEach(a=>{
  a.addEventListener('click',e=>{
    e.preventDefault();
    document.querySelectorAll('.sidebar nav a').forEach(x=>x.classList.remove('active'));
    a.classList.add('active');
    document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
    $('page-'+a.dataset.page).classList.add('active');
  });
});
// Tabs
document.querySelectorAll('.tab').forEach(t=>{
  t.addEventListener('click',()=>{
    document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(x=>x.classList.remove('active'));
    t.classList.add('active');
    $(t.dataset.tab).classList.add('active');
  });
});

function togVis(id,btn){const i=$(id);i.type=i.type==='password'?'text':'password';btn.textContent=i.type==='password'?'Show':'Hide'}

let prevHealth=null;
async function refresh(){
  const h=await api('/api/health');
  if(h){
    $('healthDot').className='dot ok';$('healthText').textContent='System Healthy';
    $('uptimeText').textContent='Uptime: '+fmtUptime(h.uptime);
    if(!prevHealth)addLog('System online','log-ok');
    prevHealth=h;
  }else{
    $('healthDot').className='dot err';$('healthText').textContent='Unreachable';
    if(prevHealth)addLog('System unreachable','log-err');
    prevHealth=null;
  }

  const sessions=await api('/api/sessions');
  if(sessions)$('mSessions').textContent=sessions.length;

  const skills=await api('/api/skills');
  if(skills){
    $('mSkills').textContent=skills.length;
    const html=skills.map(s=>'<li><span>'+s.name+'</span><span class="badge purple">v'+s.version+'</span></li>').join('');
    $('skFullList').innerHTML=html||'<li>No skills loaded</li>';
  }

  const ch=await api('/api/channels');
  if(ch){
    const connected=ch.filter(c=>c.connected).length;
    $('mChannels').textContent=connected+'/'+ch.length;
    const html=ch.map(c=>'<li><span style="text-transform:capitalize">'+c.type+'</span><span class="badge '+(c.connected?'green':'red')+'">'+(c.connected?'Connected':'Offline')+'</span></li>').join('');
    $('dChannels').innerHTML=html;$('chFullList').innerHTML=html;
  }

  const mem=await api('/api/memory/stats');
  if(mem){
    $('mMemory').textContent=mem.totalEntries;
    $('memEntries').textContent=mem.totalEntries;$('memFacts').textContent=mem.totalFacts;
    $('memDims').textContent=mem.vectorDimensions;$('memSize').textContent=(mem.storageSizeBytes/1024/1024).toFixed(1)+' MB';
  }

  const prov=await api('/api/providers');
  if(prov){
    $('dProviders').innerHTML=prov.map(p=>'<li><span>'+p.name+'</span><span class="badge blue">'+p.model+'</span></li>').join('');
  }
}

async function loadCfg(){
  const c=await api('/api/config');if(!c)return;
  if(c.provider)$('cfgProvider').value=c.provider;
  if(c.model)$('cfgModel').value=c.model;
  if(c.mode)$('cfgMode').value=c.mode;
  if(c.apiKeys){
    const m={anthropic:'keyAnthropic',openai:'keyOpenai',groq:'keyGroq',deepseek:'keyDeepseek',google:'keyGoogle',minimax:'keyMinimax'};
    for(const[k,id]of Object.entries(m)){if(c.apiKeys[k])$(id).value=c.apiKeys[k]}
  }
}

function toast(msg,type,dur){const t=$('toast');t.className='toast '+type;t.textContent=msg;setTimeout(()=>{t.className='toast';t.textContent=''},dur||3000)}

async function saveConfig(){
  $('btnSave').disabled=true;$('btnSave').textContent='Saving...';
  try{
    const body={provider:$('cfgProvider').value,model:$('cfgModel').value,
      apiKeys:{anthropic:$('keyAnthropic').value||undefined,openai:$('keyOpenai').value||undefined,
        groq:$('keyGroq').value||undefined,deepseek:$('keyDeepseek').value||undefined,
        google:$('keyGoogle').value||undefined,minimax:$('keyMinimax').value||undefined},
      channelTokens:{telegram:$('tokTelegram').value||undefined,discord:$('tokDiscord').value||undefined,
        slack:$('tokSlack').value||undefined,whatsapp:$('tokWhatsapp').value||undefined}};
    const r=await fetch('/api/config',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    const res=await r.json();
    if(res.success){toast('Settings saved successfully','ok');addLog('Configuration saved','log-ok')}
    else{toast('Error: '+(res.error||'unknown'),'err')}
  }catch{toast('Failed to save','err')}
  finally{$('btnSave').disabled=false;$('btnSave').textContent='Save Settings'}
}

async function restartGW(){
  $('btnRestart').disabled=true;
  let countdown=3;
  const tick=()=>{$('btnRestart').textContent='Restarting... '+countdown+'s';countdown--};
  tick();const iv=setInterval(tick,1000);
  try{
    await fetch('/api/restart',{method:'POST'});
    addLog('Gateway restart triggered','log-warn');
    toast('Gateway restarting...','info',4000);
    setTimeout(()=>{clearInterval(iv);$('btnRestart').disabled=false;$('btnRestart').textContent='Restart Gateway';refresh();addLog('Gateway restarted','log-ok')},4000);
  }catch{clearInterval(iv);toast('Restart failed','err');$('btnRestart').disabled=false;$('btnRestart').textContent='Restart Gateway';addLog('Restart failed','log-err')}
}

addLog('Dashboard loaded','log-ok');
refresh();loadCfg();setInterval(refresh,5000);
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
