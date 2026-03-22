const request = require('supertest');
const path = require('path');
const fs = require('fs');
const { createApp } = require('../src/index');

let app, token, supervisorToken;
const testDbPath = path.join(__dirname, '..', '..', 'data', 'test-opsshiftpro.db');

beforeAll(() => {
  if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
  app = createApp(testDbPath);
});

afterAll(() => {
  if (app._db) app._db.close();
  if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
});

describe('Health', () => {
  test('GET /api/health', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
  });
});

describe('Auth', () => {
  test('login operator1', async () => {
    const res = await request(app).post('/api/auth/login')
      .send({ username: 'operator1', password: 'Shift@2024' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    token = res.body.token;
  });

  test('login supervisor', async () => {
    const res = await request(app).post('/api/auth/login')
      .send({ username: 'supervisor', password: 'Shift@2024' });
    expect(res.status).toBe(200);
    supervisorToken = res.body.token;
  });

  test('wrong password rejected', async () => {
    const res = await request(app).post('/api/auth/login')
      .send({ username: 'operator1', password: 'wrong' });
    expect(res.status).toBe(401);
  });

  test('missing fields rejected', async () => {
    const res = await request(app).post('/api/auth/login').send({ username: '' });
    expect(res.status).toBe(400);
  });

  test('GET /api/auth/me', async () => {
    const res = await request(app).get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.username).toBe('operator1');
  });

  test('reject no token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});

let shiftId;
describe('Shifts', () => {
  test('create shift', async () => {
    const res = await request(app).post('/api/shifts')
      .set('Authorization', `Bearer ${token}`)
      .send({ operator_name: 'Alex', start_time: '2024-06-01T08:00:00Z', end_time: '2024-06-01T16:00:00Z' });
    expect(res.status).toBe(201);
    expect(res.body.shift.status).toBe('active');
    shiftId = res.body.shift.id;
  });

  test('list shifts', async () => {
    const res = await request(app).get('/api/shifts')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.shifts.length).toBeGreaterThanOrEqual(1);
  });

  test('update shift status', async () => {
    const res = await request(app).patch(`/api/shifts/${shiftId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'completed', notes: 'All clear' });
    expect(res.status).toBe(200);
    expect(res.body.shift.status).toBe('completed');
  });

  test('404 for missing shift', async () => {
    const res = await request(app).patch('/api/shifts/9999')
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'completed' });
    expect(res.status).toBe(404);
  });
});

let itemId;
describe('Handover Items', () => {
  test('create handover item', async () => {
    const res = await request(app).post(`/api/shifts/${shiftId}/items`)
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'issue', description: 'Server lag detected', priority: 'high' });
    expect(res.status).toBe(201);
    expect(res.body.item).toBeDefined();
    itemId = res.body.item.id;
  });

  test('reject invalid type', async () => {
    const res = await request(app).post(`/api/shifts/${shiftId}/items`)
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'invalid', description: 'test' });
    expect(res.status).toBe(400);
  });

  test('list items for shift', async () => {
    const res = await request(app).get(`/api/shifts/${shiftId}/items`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.items.length).toBeGreaterThanOrEqual(1);
  });

  test('404 for missing shift items', async () => {
    const res = await request(app).get('/api/shifts/9999/items')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  test('resolve item', async () => {
    const res = await request(app).patch(`/api/items/${itemId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ resolved: true });
    expect(res.status).toBe(200);
    expect(res.body.item.resolved).toBe(1);
  });

  test('404 for missing item', async () => {
    const res = await request(app).patch('/api/items/9999')
      .set('Authorization', `Bearer ${token}`)
      .send({ resolved: true });
    expect(res.status).toBe(404);
  });
});

describe('Checklists', () => {
  let checklistId, checklistItemId;

  test('create checklist', async () => {
    const res = await request(app).post('/api/checklists')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Pre-shift Check', shift_id: shiftId, items: [{ label: 'Check servers' }, { label: 'Check logs' }] });
    expect(res.status).toBe(201);
    expect(res.body.checklist.items.length).toBe(2);
    checklistId = res.body.checklist.id;
    checklistItemId = res.body.checklist.items[0].id;
  });

  test('list checklists', async () => {
    const res = await request(app).get('/api/checklists')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.checklists.length).toBeGreaterThanOrEqual(1);
  });

  test('toggle checklist item', async () => {
    const res = await request(app).patch(`/api/checklists/${checklistId}/items/${checklistItemId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.item.checked).toBe(1);
  });

  test('404 for missing checklist', async () => {
    const res = await request(app).patch('/api/checklists/9999/items/1')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});

describe('Shift Report', () => {
  test('get shift report', async () => {
    const res = await request(app).get(`/api/shifts/${shiftId}/report`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.report.summary).toBeDefined();
  });
});
