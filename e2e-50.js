// 50-scenario E2E test runner
const http = require('http');

let pass = 0, total = 0;

function req(port, method, path, body, headers = {}) {
  return new Promise((resolve) => {
    const opts = { hostname: '127.0.0.1', port, method, path, headers: { 'Content-Type': 'application/json', ...headers } };
    const r = http.request(opts, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => { try { resolve({ status: res.statusCode, body: JSON.parse(data) }); } catch { resolve({ status: res.statusCode, body: data }); } });
    });
    r.on('error', () => resolve({ status: 0, body: {} }));
    if (body) r.write(JSON.stringify(body));
    r.end();
  });
}

function check(name, cond) {
  total++;
  if (cond) { pass++; console.log(`  ${name}: PASS`); }
  else { console.log(`  ${name}: FAIL`); }
}

async function run() {
  // === FAMILY HUB (3000) ===
  console.log('=== Family Hub ===');
  let r = await req(3000, 'POST', '/api/auth/login', { username: 'bala', password: 'Family@2024' });
  const fhToken = r.body.token;
  check('1.Login', !!fhToken);
  const fh = { Authorization: `Bearer ${fhToken}` };

  r = await req(3000, 'POST', '/api/messages', { content: 'Hello family!' }, fh);
  check('2.Chat', r.body.message?.content === 'Hello family!');

  r = await req(3000, 'POST', '/api/shopping', { name: 'Weekly' }, fh);
  check('3.Shopping', !!r.body.list?.id);

  r = await req(3000, 'POST', '/api/todos', { text: 'Pickup', priority: 'urgent' }, fh);
  const todoId = r.body.todo?.id;
  check('4.Task', r.body.todo?.priority === 'urgent');

  r = await req(3000, 'PATCH', `/api/todos/${todoId}`, { done: true }, fh);
  check('5.Complete', r.body.todo?.done === 1);

  r = await req(3000, 'POST', '/api/journal', { title: 'Great', mood: 'happy' }, fh);
  check('6.Journal', r.body.entry?.mood === 'happy');

  r = await req(3000, 'POST', '/api/events', { title: 'Birthday', event_date: '2026-05-01' }, fh);
  check('7.Event', !!r.body.event);

  r = await req(3000, 'GET', '/api/health');
  check('8.Health', r.body.status === 'ok');

  // === ARIVUWATCH (9000) ===
  console.log('=== ArivuWatch ===');
  r = await req(9000, 'POST', '/api/auth/login', { username: 'admin', password: 'Watch@2024' });
  const awToken = r.body.token;
  check('9.Login', !!awToken);
  const aw = { Authorization: `Bearer ${awToken}` };

  r = await req(9000, 'POST', '/api/services', { name: 'Self', port: 9000, health_path: '/api/health' }, aw);
  check('10.AddSvc', r.status === 201);

  r = await req(9000, 'POST', '/api/notes', { title: 'Log', content: 'data', pinned: true }, aw);
  check('11.Note', r.body.note?.pinned === 1);

  r = await req(9000, 'POST', '/api/todos', { title: 'Fix', priority: 'urgent' }, aw);
  check('12.Todo', r.body.todo?.priority === 'urgent');

  r = await req(9000, 'GET', '/api/status/history', null, aw);
  check('13.History', Array.isArray(r.body.history));

  r = await req(9000, 'GET', '/api/health');
  check('14.Health', r.body.status === 'ok');

  // === VAULT BROWSER (4100) ===
  console.log('=== Vault Browser ===');
  r = await req(4100, 'POST', '/api/vault/create', { name: 'Test', master_password: 'Master123!' });
  const vaultId = r.body.vault?.id;
  check('15.Create', !!vaultId);

  r = await req(4100, 'POST', '/api/vault/unlock', { vault_id: vaultId, master_password: 'Master123!' });
  const vToken = r.body.token;
  check('16.Unlock', !!vToken);
  const vh = { Authorization: `Bearer ${vToken}`, 'x-master-key': 'Master123!' };

  r = await req(4100, 'POST', '/api/vault/entries', { title: 'AWS', username: 'admin', password: 'aws-123', category: 'dev' }, vh);
  check('17.AddEntry', r.status === 201);

  r = await req(4100, 'GET', '/api/vault/entries', null, vh);
  check('18.Decrypt', r.body.entries?.[0]?.password === 'aws-123');

  r = await req(4100, 'POST', '/api/vault/generate', { length: 24 });
  check('19.GenPwd', r.body.password?.length === 24);

  r = await req(4100, 'POST', '/api/vault/check-strength', { password: 'Str0ng!Pass#2024' });
  check('20.Strength', ['strong','excellent'].includes(r.body.strength));

  r = await req(4100, 'GET', '/api/vault/export', null, { Authorization: `Bearer ${vToken}` });
  check('21.Export', r.body.export_version === 1);

  // === OPSWATCH (3001) ===
  console.log('=== OpsWatch ===');
  r = await req(3001, 'POST', '/api/auth/login', { username: 'admin', password: 'OpsWatch@2024' });
  const owToken = r.body.token;
  check('22.Login', !!owToken);
  const ow = { Authorization: `Bearer ${owToken}` };

  r = await req(3001, 'POST', '/api/services', { name: 'Self', host: 'localhost', port: 3001, health_path: '/api/health' }, ow);
  check('23.AddSvc', !!r.body.service || r.status === 201);

  r = await req(3001, 'POST', '/api/alerts', { title: 'CPU', severity: 'critical', service_name: 'Self' }, ow);
  const alertId = r.body.alert?.id || r.body.id;
  check('24.Alert', !!alertId);

  r = await req(3001, 'GET', '/api/alerts', null, ow);
  check('25.ListAlerts', Array.isArray(r.body.alerts));

  r = await req(3001, 'GET', '/api/dashboard/stats', null, ow);
  check('26.Stats', r.body.total !== undefined || r.body.stats !== undefined);

  r = await req(3001, 'GET', '/api/health');
  check('27.Health', r.body.status === 'ok' || r.body.status === 'healthy');

  // === OPSSHIFTPRO (4000) ===
  console.log('=== OpsShiftPro ===');
  r = await req(4000, 'POST', '/api/auth/login', { username: 'operator1', password: 'Shift@2024' });
  const spToken = r.body.token;
  check('28.Login', !!spToken);
  const sp = { Authorization: `Bearer ${spToken}` };

  r = await req(4000, 'POST', '/api/shifts', { operator_name: 'Alex', start_time: '2026-03-22T08:00:00Z' }, sp);
  const shiftId = r.body.shift?.id;
  check('29.Shift', r.body.shift?.status === 'active');

  r = await req(4000, 'POST', `/api/shifts/${shiftId}/items`, { type: 'issue', description: 'Lag' }, sp);
  check('30.Item', r.status === 201);

  r = await req(4000, 'POST', '/api/checklists', { name: 'Pre', shift_id: shiftId, items: [{ label: 'Check' }] }, sp);
  check('31.Checklist', r.status === 201);

  r = await req(4000, 'PATCH', `/api/shifts/${shiftId}`, { status: 'completed' }, sp);
  check('32.Complete', r.body.shift?.status === 'completed');

  r = await req(4000, 'GET', `/api/shifts/${shiftId}/report`, null, sp);
  check('33.Report', !!r.body.report?.summary);

  r = await req(4000, 'GET', '/api/health');
  check('34.Health', r.body.status === 'healthy');

  // === NEURAL BRAIN (8200) ===
  console.log('=== Neural Brain ===');
  r = await req(8200, 'POST', '/api/auth/login', { username: 'admin', password: 'Neural@2024' });
  const nbToken = r.body.token;
  check('35.Login', !!nbToken);
  const nb = { Authorization: `Bearer ${nbToken}` };

  r = await req(8200, 'POST', '/api/analyze/sentiment', { text: 'Amazing wonderful great' }, nb);
  check('36.Positive', r.body.sentiment === 'positive');

  r = await req(8200, 'POST', '/api/analyze/sentiment', { text: 'Terrible awful bad' }, nb);
  check('37.Negative', r.body.sentiment === 'negative');

  r = await req(8200, 'POST', '/api/prompts', { title: 'Review', content: 'Check code', category: 'dev' }, nb);
  check('38.Prompt', !!r.body.prompt || r.status === 201);

  r = await req(8200, 'GET', '/api/prompts', null, nb);
  check('39.ListPrompts', Array.isArray(r.body.prompts));

  r = await req(8200, 'POST', '/api/conversations', { title: 'Test' }, nb);
  check('40.Conversation', r.status === 201 || !!r.body.conversation);

  r = await req(8200, 'GET', '/api/health');
  check('41.Health', r.body.status === 'ok' || r.body.status === 'healthy');

  console.log(`\n=== Node.js Total: ${pass}/${total} ===`);
}

run().catch(e => console.error(e));
