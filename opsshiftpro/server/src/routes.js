const express = require('express');
const bcrypt = require('bcryptjs');
const { body, param, validationResult } = require('express-validator');
const { generateToken, authenticate } = require('./auth');

function createRouter(db) {
  const router = express.Router();

  function handleValidation(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ error: 'Validation failed', details: errors.array() });
      return false;
    }
    return true;
  }

  // Health
  router.get('/health', function (_req, res) {
    try {
      db.prepare('SELECT 1').get();
      res.json({ status: 'healthy', service: 'OpsShiftPro', timestamp: new Date().toISOString() });
    } catch (err) {
      res.status(503).json({ status: 'unhealthy', error: err.message });
    }
  });

  // Auth - login
  router.post('/auth/login', [
    body('username').isString().trim().notEmpty().withMessage('Username is required'),
    body('password').isString().notEmpty().withMessage('Password is required'),
  ], function (req, res) {
    if (!handleValidation(req, res)) return;
    var username = req.body.username;
    var password = req.body.password;
    var user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    var token = generateToken(user);
    res.json({
      token: token,
      user: { id: user.id, username: user.username, role: user.role, full_name: user.full_name },
    });
  });

  // Auth - me
  router.get('/auth/me', authenticate, function (req, res) {
    var user = db.prepare('SELECT id, username, role, full_name, created_at FROM users WHERE id = ?').get(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user: user });
  });

  // Auth - change password
  router.post('/auth/change-password', authenticate, [
    body('current_password').notEmpty(),
    body('new_password').isLength({ min: 6 }),
  ], function (req, res) {
    if (!handleValidation(req, res)) return;
    var user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (!bcrypt.compareSync(req.body.current_password, user.password)) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }
    var hashed = bcrypt.hashSync(req.body.new_password, 10);
    db.prepare("UPDATE users SET password = ?, updated_at = datetime('now') WHERE id = ?").run(hashed, req.user.id);
    res.json({ message: 'Password changed successfully' });
  });

  // Shifts - export all shifts with items and checklists for reporting
  router.get('/shifts/export', authenticate, function (_req, res) {
    var shifts = db.prepare('SELECT * FROM shifts ORDER BY created_at DESC').all();
    for (var i = 0; i < shifts.length; i++) {
      shifts[i].handover_items = db.prepare('SELECT * FROM handover_items WHERE shift_id = ? ORDER BY created_at DESC').all(shifts[i].id);
      var checklists = db.prepare('SELECT * FROM checklists WHERE shift_id = ?').all(shifts[i].id);
      for (var j = 0; j < checklists.length; j++) {
        checklists[j].items = db.prepare('SELECT * FROM checklist_items WHERE checklist_id = ?').all(checklists[j].id);
      }
      shifts[i].checklists = checklists;
    }
    res.json({ exported_at: new Date().toISOString(), total_shifts: shifts.length, shifts: shifts });
  });

  // Shifts - get currently active shift
  router.get('/shifts/active', authenticate, function (_req, res) {
    var shift = db.prepare("SELECT s.*, u.username, u.full_name FROM shifts s LEFT JOIN users u ON u.id = s.user_id WHERE s.status = 'active' ORDER BY s.created_at DESC LIMIT 1").get();
    if (!shift) return res.status(404).json({ error: 'No active shift found' });
    var handoverItems = db.prepare('SELECT * FROM handover_items WHERE shift_id = ? ORDER BY created_at DESC').all(shift.id);
    var checklists = db.prepare('SELECT * FROM checklists WHERE shift_id = ?').all(shift.id);
    for (var i = 0; i < checklists.length; i++) {
      checklists[i].items = db.prepare('SELECT * FROM checklist_items WHERE checklist_id = ?').all(checklists[i].id);
    }
    res.json({ shift: shift, handover_items: handoverItems, checklists: checklists });
  });

  // Shifts - list (with joined user data)
  router.get('/shifts', authenticate, function (req, res) {
    var status = req.query.status;
    var limit = req.query.limit || 50;
    var offset = req.query.offset || 0;
    var query = 'SELECT s.*, u.username, u.full_name FROM shifts s LEFT JOIN users u ON u.id = s.user_id';
    var params = [];
    if (status) {
      query += ' WHERE s.status = ?';
      params.push(status);
    }
    query += ' ORDER BY s.created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));
    var shifts = db.prepare(query).all.apply(db.prepare(query), params);
    res.json({ shifts: shifts });
  });

  // Shifts - get one with details
  router.get('/shifts/:id', authenticate, function (req, res) {
    var shift = db.prepare('SELECT * FROM shifts WHERE id = ?').get(req.params.id);
    if (!shift) return res.status(404).json({ error: 'Shift not found' });
    var handoverItems = db.prepare('SELECT * FROM handover_items WHERE shift_id = ? ORDER BY created_at DESC').all(shift.id);
    var checklists = db.prepare('SELECT * FROM checklists WHERE shift_id = ?').all(shift.id);
    for (var i = 0; i < checklists.length; i++) {
      checklists[i].items = db.prepare('SELECT * FROM checklist_items WHERE checklist_id = ?').all(checklists[i].id);
    }
    res.json({ shift: shift, handover_items: handoverItems, checklists: checklists });
  });

  // Shifts - create (accepts title or operator_name)
  router.post('/shifts', authenticate, [
    body('start_time').isString().notEmpty().withMessage('Start time is required'),
    body('end_time').optional({ values: 'null' }).isString(),
  ], function (req, res) {
    if (!handleValidation(req, res)) return;
    var nameVal = req.body.operator_name || req.body.title;
    if (!nameVal) {
      return res.status(400).json({ error: 'Validation failed', details: [{ msg: 'operator_name or title is required' }] });
    }
    var userId = req.user.id;
    var operator = db.prepare('SELECT id, username, full_name FROM users WHERE id = ?').get(userId);
    var operatorName = operator ? (operator.full_name || operator.username) : nameVal;

    var result = db.prepare(
      "INSERT INTO shifts (operator_name, user_id, start_time, end_time, summary, status) VALUES (?, ?, ?, ?, ?, 'active')"
    ).run(operatorName, userId, req.body.start_time, req.body.end_time || null, req.body.summary || nameVal);
    var shift = db.prepare('SELECT * FROM shifts WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ shift: shift });
  });

  // Shifts - update via PUT
  router.put('/shifts/:id', authenticate, function (req, res) {
    var shift = db.prepare('SELECT * FROM shifts WHERE id = ?').get(req.params.id);
    if (!shift) return res.status(404).json({ error: 'Shift not found' });
    db.prepare("UPDATE shifts SET operator_name = COALESCE(?, operator_name), start_time = COALESCE(?, start_time), end_time = COALESCE(?, end_time), status = COALESCE(?, status), summary = COALESCE(?, summary), updated_at = datetime('now') WHERE id = ?")
      .run(req.body.operator_name || null, req.body.start_time || null, req.body.end_time || null, req.body.status || null, req.body.summary || null, req.params.id);
    var updated = db.prepare('SELECT * FROM shifts WHERE id = ?').get(req.params.id);
    res.json({ shift: updated });
  });

  // Shifts - update via PATCH (accepts notes as summary alias)
  router.patch('/shifts/:id', authenticate, function (req, res) {
    var shift = db.prepare('SELECT * FROM shifts WHERE id = ?').get(req.params.id);
    if (!shift) return res.status(404).json({ error: 'Shift not found' });
    var fields = {};
    if (req.body.status !== undefined) fields.status = req.body.status;
    if (req.body.notes !== undefined) fields.summary = req.body.notes;
    if (req.body.summary !== undefined) fields.summary = req.body.summary;
    if (req.body.end_time !== undefined) fields.end_time = req.body.end_time;
    if (req.body.operator_name !== undefined) fields.operator_name = req.body.operator_name;
    var keys = Object.keys(fields);
    if (keys.length === 0) return res.status(400).json({ error: 'No fields to update' });
    var setClauses = keys.map(function (k) { return k + ' = ?'; }).join(', ');
    var values = keys.map(function (k) { return fields[k]; });
    values.push(req.params.id);
    var stmt = db.prepare("UPDATE shifts SET " + setClauses + ", updated_at = datetime('now') WHERE id = ?");
    stmt.run.apply(stmt, values);
    var updated = db.prepare('SELECT * FROM shifts WHERE id = ?').get(req.params.id);
    res.json({ shift: updated });
  });

  // Shifts - delete
  router.delete('/shifts/:id', authenticate, function (req, res) {
    var shift = db.prepare('SELECT * FROM shifts WHERE id = ?').get(req.params.id);
    if (!shift) return res.status(404).json({ error: 'Shift not found' });
    db.prepare('DELETE FROM shifts WHERE id = ?').run(req.params.id);
    res.json({ message: 'Shift deleted' });
  });

  // Handover Items - list for shift (/items endpoint)
  router.get('/shifts/:shiftId/items', authenticate, function (req, res) {
    var shift = db.prepare('SELECT id FROM shifts WHERE id = ?').get(req.params.shiftId);
    if (!shift) return res.status(404).json({ error: 'Shift not found' });
    var items = db.prepare('SELECT * FROM handover_items WHERE shift_id = ? ORDER BY created_at DESC').all(req.params.shiftId);
    res.json({ items: items });
  });

  // Handover Items - list for shift (/handover-items endpoint)
  router.get('/shifts/:shiftId/handover-items', authenticate, function (req, res) {
    var items = db.prepare('SELECT * FROM handover_items WHERE shift_id = ? ORDER BY created_at DESC').all(req.params.shiftId);
    res.json({ handover_items: items });
  });

  // Handover Items - create (/items endpoint)
  router.post('/shifts/:shiftId/items', authenticate, [
    body('description').isString().trim().notEmpty().withMessage('Description is required'),
    body('type').isIn(['issue', 'note', 'pending_task']).withMessage('Type must be issue, note, or pending_task'),
    body('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
  ], function (req, res) {
    if (!handleValidation(req, res)) return;
    var shift = db.prepare('SELECT id FROM shifts WHERE id = ?').get(req.params.shiftId);
    if (!shift) return res.status(404).json({ error: 'Shift not found' });
    var result = db.prepare(
      'INSERT INTO handover_items (shift_id, type, title, description, priority) VALUES (?, ?, ?, ?, ?)'
    ).run(req.params.shiftId, req.body.type, req.body.description, req.body.description, req.body.priority || 'medium');
    var item = db.prepare('SELECT * FROM handover_items WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ item: item });
  });

  // Handover Items - create (/handover-items endpoint)
  router.post('/shifts/:shiftId/handover-items', authenticate, [
    body('type').isIn(['issue', 'note', 'pending_task']),
    body('title').notEmpty().trim(),
  ], function (req, res) {
    if (!handleValidation(req, res)) return;
    var shift = db.prepare('SELECT * FROM shifts WHERE id = ?').get(req.params.shiftId);
    if (!shift) return res.status(404).json({ error: 'Shift not found' });
    var result = db.prepare(
      'INSERT INTO handover_items (shift_id, type, title, description, priority) VALUES (?, ?, ?, ?, ?)'
    ).run(req.params.shiftId, req.body.type, req.body.title, req.body.description || null, req.body.priority || 'medium');
    var item = db.prepare('SELECT * FROM handover_items WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ handover_item: item });
  });

  // Handover Items - update via PATCH
  router.patch('/items/:id', authenticate, function (req, res) {
    var item = db.prepare('SELECT * FROM handover_items WHERE id = ?').get(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    var fields = {};
    if (req.body.description !== undefined) {
      fields.description = req.body.description;
      fields.title = req.body.description;
    }
    if (req.body.resolved !== undefined) fields.resolved = req.body.resolved ? 1 : 0;
    if (req.body.priority !== undefined) fields.priority = req.body.priority;
    var keys = Object.keys(fields);
    if (keys.length === 0) return res.status(400).json({ error: 'No fields to update' });
    var setClauses = keys.map(function (k) { return k + ' = ?'; }).join(', ');
    var values = keys.map(function (k) { return fields[k]; });
    values.push(req.params.id);
    var stmt = db.prepare("UPDATE handover_items SET " + setClauses + ", updated_at = datetime('now') WHERE id = ?");
    stmt.run.apply(stmt, values);
    var updated = db.prepare('SELECT * FROM handover_items WHERE id = ?').get(req.params.id);
    res.json({ item: updated });
  });

  // Handover Items - update via PUT
  router.put('/handover-items/:id', authenticate, function (req, res) {
    var item = db.prepare('SELECT * FROM handover_items WHERE id = ?').get(req.params.id);
    if (!item) return res.status(404).json({ error: 'Handover item not found' });
    db.prepare("UPDATE handover_items SET type = COALESCE(?, type), title = COALESCE(?, title), description = COALESCE(?, description), priority = COALESCE(?, priority), resolved = COALESCE(?, resolved), updated_at = datetime('now') WHERE id = ?")
      .run(req.body.type || null, req.body.title || null, req.body.description || null, req.body.priority || null, req.body.resolved !== undefined ? (req.body.resolved ? 1 : 0) : null, req.params.id);
    var updated = db.prepare('SELECT * FROM handover_items WHERE id = ?').get(req.params.id);
    res.json({ handover_item: updated });
  });

  // Handover Items - delete
  router.delete('/handover-items/:id', authenticate, function (req, res) {
    var item = db.prepare('SELECT * FROM handover_items WHERE id = ?').get(req.params.id);
    if (!item) return res.status(404).json({ error: 'Handover item not found' });
    db.prepare('DELETE FROM handover_items WHERE id = ?').run(req.params.id);
    res.json({ message: 'Handover item deleted' });
  });

  // Checklists - list all
  router.get('/checklists', authenticate, function (_req, res) {
    var checklists = db.prepare('SELECT * FROM checklists ORDER BY created_at DESC').all();
    var getItems = db.prepare('SELECT * FROM checklist_items WHERE checklist_id = ? ORDER BY id ASC');
    var result = checklists.map(function (cl) {
      return Object.assign({}, cl, { items: getItems.all(cl.id) });
    });
    res.json({ checklists: result });
  });

  // Checklists - list for shift
  router.get('/shifts/:shiftId/checklists', authenticate, function (req, res) {
    var checklists = db.prepare('SELECT * FROM checklists WHERE shift_id = ?').all(req.params.shiftId);
    for (var i = 0; i < checklists.length; i++) {
      checklists[i].items = db.prepare('SELECT * FROM checklist_items WHERE checklist_id = ?').all(checklists[i].id);
    }
    res.json({ checklists: checklists });
  });

  // Checklists - create (top-level with name + shift_id)
  router.post('/checklists', authenticate, [
    body('name').isString().trim().notEmpty().isLength({ max: 300 }).withMessage('Name is required'),
    body('shift_id').isInt().withMessage('Shift ID is required'),
    body('type').optional().isIn(['pre_shift', 'post_shift']),
    body('items').isArray({ min: 1 }).withMessage('Items array required with at least one item'),
    body('items.*.label').isString().trim().notEmpty().withMessage('Each item must have a label'),
  ], function (req, res) {
    if (!handleValidation(req, res)) return;
    var shift = db.prepare('SELECT id FROM shifts WHERE id = ?').get(req.body.shift_id);
    if (!shift) return res.status(404).json({ error: 'Shift not found' });
    var result = db.prepare('INSERT INTO checklists (shift_id, type, title) VALUES (?, ?, ?)').run(req.body.shift_id, req.body.type || 'pre_shift', req.body.name);
    var checklistId = result.lastInsertRowid;
    var insertItem = db.prepare('INSERT INTO checklist_items (checklist_id, label) VALUES (?, ?)');
    for (var i = 0; i < req.body.items.length; i++) {
      insertItem.run(checklistId, req.body.items[i].label);
    }
    var checklist = db.prepare('SELECT * FROM checklists WHERE id = ?').get(checklistId);
    var checklistItems = db.prepare('SELECT * FROM checklist_items WHERE checklist_id = ? ORDER BY id ASC').all(checklistId);
    res.status(201).json({ checklist: Object.assign({}, checklist, { items: checklistItems }) });
  });

  // Checklists - create (per-shift URL)
  router.post('/shifts/:shiftId/checklists', authenticate, [
    body('type').isIn(['pre_shift', 'post_shift']),
    body('title').notEmpty().trim(),
  ], function (req, res) {
    if (!handleValidation(req, res)) return;
    var shift = db.prepare('SELECT * FROM shifts WHERE id = ?').get(req.params.shiftId);
    if (!shift) return res.status(404).json({ error: 'Shift not found' });
    var result = db.prepare('INSERT INTO checklists (shift_id, type, title) VALUES (?, ?, ?)').run(req.params.shiftId, req.body.type, req.body.title);
    var checklistId = result.lastInsertRowid;
    if (req.body.items && Array.isArray(req.body.items)) {
      var insertItem = db.prepare('INSERT INTO checklist_items (checklist_id, label) VALUES (?, ?)');
      for (var i = 0; i < req.body.items.length; i++) {
        insertItem.run(checklistId, req.body.items[i].label || req.body.items[i]);
      }
    }
    var checklist = db.prepare('SELECT * FROM checklists WHERE id = ?').get(checklistId);
    checklist.items = db.prepare('SELECT * FROM checklist_items WHERE checklist_id = ?').all(checklistId);
    res.status(201).json({ checklist: checklist });
  });

  // Checklist Items - toggle via PATCH
  router.patch('/checklists/:id/items/:itemId', authenticate, function (req, res) {
    var checklist = db.prepare('SELECT * FROM checklists WHERE id = ?').get(req.params.id);
    if (!checklist) return res.status(404).json({ error: 'Checklist not found' });
    var item = db.prepare('SELECT * FROM checklist_items WHERE id = ? AND checklist_id = ?').get(req.params.itemId, req.params.id);
    if (!item) return res.status(404).json({ error: 'Checklist item not found' });
    var newChecked = item.checked ? 0 : 1;
    var checkedAt = newChecked ? new Date().toISOString() : null;
    db.prepare('UPDATE checklist_items SET checked = ?, checked_at = ? WHERE id = ?').run(newChecked, checkedAt, req.params.itemId);
    var allItems = db.prepare('SELECT * FROM checklist_items WHERE checklist_id = ?').all(req.params.id);
    var allChecked = allItems.every(function (ci) { return ci.id === item.id ? newChecked : ci.checked; });
    db.prepare("UPDATE checklists SET completed = ?, updated_at = datetime('now') WHERE id = ?").run(allChecked ? 1 : 0, req.params.id);
    var updatedItem = db.prepare('SELECT * FROM checklist_items WHERE id = ?').get(req.params.itemId);
    res.json({ item: updatedItem });
  });

  // Checklist Items - update via PUT
  router.put('/checklist-items/:id', authenticate, function (req, res) {
    var item = db.prepare('SELECT * FROM checklist_items WHERE id = ?').get(req.params.id);
    if (!item) return res.status(404).json({ error: 'Checklist item not found' });
    var checkedAt = req.body.checked ? new Date().toISOString() : null;
    db.prepare("UPDATE checklist_items SET label = COALESCE(?, label), checked = COALESCE(?, checked), checked_at = ? WHERE id = ?")
      .run(req.body.label || null, req.body.checked !== undefined ? (req.body.checked ? 1 : 0) : null, checkedAt, req.params.id);
    var updated = db.prepare('SELECT * FROM checklist_items WHERE id = ?').get(req.params.id);
    var allItems = db.prepare('SELECT * FROM checklist_items WHERE checklist_id = ?').all(item.checklist_id);
    var allChecked = allItems.every(function (ci) { return ci.id === updated.id ? updated.checked : ci.checked; });
    db.prepare("UPDATE checklists SET completed = ?, updated_at = datetime('now') WHERE id = ?").run(allChecked ? 1 : 0, item.checklist_id);
    res.json({ checklist_item: updated });
  });

  // Shift Report
  router.get('/shifts/:id/report', authenticate, function (req, res) {
    var shift = db.prepare('SELECT * FROM shifts WHERE id = ?').get(req.params.id);
    if (!shift) return res.status(404).json({ error: 'Shift not found' });
    var handoverItems = db.prepare('SELECT * FROM handover_items WHERE shift_id = ?').all(shift.id);
    var checklists = db.prepare('SELECT * FROM checklists WHERE shift_id = ?').all(shift.id);
    for (var i = 0; i < checklists.length; i++) {
      checklists[i].items = db.prepare('SELECT * FROM checklist_items WHERE checklist_id = ?').all(checklists[i].id);
    }
    var issues = handoverItems.filter(function (x) { return x.type === 'issue'; });
    var notes = handoverItems.filter(function (x) { return x.type === 'note'; });
    var pending = handoverItems.filter(function (x) { return x.type === 'pending_task'; });
    var unresolved = handoverItems.filter(function (x) { return !x.resolved; });
    var totalCL = checklists.reduce(function (s, c) { return s + (c.items ? c.items.length : 0); }, 0);
    var checkedCL = checklists.reduce(function (s, c) { return s + (c.items ? c.items.filter(function (x) { return x.checked; }).length : 0); }, 0);
    res.json({
      report: {
        shift: shift,
        summary: {
          total_handover_items: handoverItems.length,
          issues_count: issues.length,
          notes_count: notes.length,
          pending_tasks_count: pending.length,
          unresolved_count: unresolved.length,
          checklist_progress: totalCL > 0 ? checkedCL + '/' + totalCL : 'No checklists',
          checklist_completion_pct: totalCL > 0 ? Math.round((checkedCL / totalCL) * 100) : 0
        },
        handover_items: handoverItems,
        checklists: checklists
      }
    });
  });

  return router;
}

module.exports = { createRouter };
