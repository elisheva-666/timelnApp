const express = require('express');
const db = require('../database/db');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

function checkOverlap(userId, date, startTime, endTime, excludeId = null) {
  if (!startTime || !endTime) return false;
  let query = `
    SELECT id FROM time_entries
    WHERE user_id = ? AND date = ? AND start_time IS NOT NULL AND end_time IS NOT NULL
    AND start_time < ? AND end_time > ?
  `;
  const params = [userId, date, endTime, startTime];
  if (excludeId) { query += ' AND id != ?'; params.push(excludeId); }
  return db.prepare(query).get(...params) !== undefined;
}

// GET time entries
router.get('/', authenticate, (req, res) => {
  const { user_id, project_id, task_id, date_from, date_to, status } = req.query;

  let query = `
    SELECT te.*, u.full_name as user_name, p.project_name, t.task_name
    FROM time_entries te
    JOIN users u ON te.user_id = u.id
    JOIN projects p ON te.project_id = p.id
    LEFT JOIN tasks t ON te.task_id = t.id
    WHERE 1=1
  `;
  const params = [];

  // Permission filter
  if (req.user.role === 'employee') {
    query += ' AND te.user_id = ?';
    params.push(req.user.id);
  } else if (user_id) {
    query += ' AND te.user_id = ?';
    params.push(user_id);
  }

  if (project_id) { query += ' AND te.project_id = ?'; params.push(project_id); }
  if (task_id) { query += ' AND te.task_id = ?'; params.push(task_id); }
  if (date_from) { query += ' AND te.date >= ?'; params.push(date_from); }
  if (date_to) { query += ' AND te.date <= ?'; params.push(date_to); }
  if (status) { query += ' AND te.status = ?'; params.push(status); }

  query += ' ORDER BY te.date DESC, te.start_time DESC';
  res.json(db.prepare(query).all(...params));
});

// GET single entry
router.get('/:id', authenticate, (req, res) => {
  const entry = db.prepare(`
    SELECT te.*, u.full_name as user_name, p.project_name, t.task_name
    FROM time_entries te
    JOIN users u ON te.user_id = u.id
    JOIN projects p ON te.project_id = p.id
    LEFT JOIN tasks t ON te.task_id = t.id
    WHERE te.id = ?
  `).get(req.params.id);

  if (!entry) return res.status(404).json({ error: 'Entry not found' });
  if (req.user.role === 'employee' && entry.user_id !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  res.json(entry);
});

// POST create entry
router.post('/', authenticate, (req, res) => {
  const { project_id, task_id, date, start_time, end_time, duration_minutes, work_type, description, source, status, related_commit_ids, related_clickup_task_id } = req.body;

  if (!project_id || !date) {
    return res.status(400).json({ error: 'project_id and date are required' });
  }

  let duration = duration_minutes;
  if (!duration && start_time && end_time) {
    const [sh, sm] = start_time.split(':').map(Number);
    const [eh, em] = end_time.split(':').map(Number);
    duration = (eh * 60 + em) - (sh * 60 + sm);
  }

  if (!duration || duration <= 0) {
    return res.status(400).json({ error: 'Duration must be positive. Check start/end times.' });
  }

  const userId = req.user.role !== 'employee' && req.body.user_id ? req.body.user_id : req.user.id;

  if (checkOverlap(userId, date, start_time, end_time)) {
    return res.status(409).json({ error: 'Time overlap detected with existing entry', overlap: true });
  }

  const result = db.prepare(`
    INSERT INTO time_entries (user_id, project_id, task_id, date, start_time, end_time, duration_minutes, work_type, description, source, status, related_commit_ids, related_clickup_task_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    userId, project_id, task_id || null, date,
    start_time || null, end_time || null, duration,
    work_type || 'development', description || null,
    source || 'manual', status || 'submitted',
    related_commit_ids || null, related_clickup_task_id || null
  );

  const entry = db.prepare(`
    SELECT te.*, u.full_name as user_name, p.project_name, t.task_name
    FROM time_entries te
    JOIN users u ON te.user_id = u.id
    JOIN projects p ON te.project_id = p.id
    LEFT JOIN tasks t ON te.task_id = t.id
    WHERE te.id = ?
  `).get(result.lastInsertRowid);

  res.status(201).json(entry);
});

// PUT update entry
router.put('/:id', authenticate, (req, res) => {
  const id = parseInt(req.params.id);
  const entry = db.prepare('SELECT * FROM time_entries WHERE id = ?').get(id);
  if (!entry) return res.status(404).json({ error: 'Entry not found' });
  if (req.user.role === 'employee' && entry.user_id !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { project_id, task_id, date, start_time, end_time, duration_minutes, work_type, description, source, status, related_commit_ids, related_clickup_task_id } = req.body;

  const newDate = date || entry.date;
  const newStart = start_time !== undefined ? start_time : entry.start_time;
  const newEnd = end_time !== undefined ? end_time : entry.end_time;

  let duration = duration_minutes || entry.duration_minutes;
  if (newStart && newEnd && (start_time || end_time)) {
    const [sh, sm] = newStart.split(':').map(Number);
    const [eh, em] = newEnd.split(':').map(Number);
    const calc = (eh * 60 + em) - (sh * 60 + sm);
    if (calc > 0) duration = calc;
  }

  if (duration <= 0) {
    return res.status(400).json({ error: 'Duration must be positive' });
  }

  if (checkOverlap(entry.user_id, newDate, newStart, newEnd, id)) {
    return res.status(409).json({ error: 'Time overlap detected', overlap: true });
  }

  db.prepare(`
    UPDATE time_entries SET project_id=?, task_id=?, date=?, start_time=?, end_time=?,
      duration_minutes=?, work_type=?, description=?, source=?, status=?,
      related_commit_ids=?, related_clickup_task_id=?, updated_at=datetime('now')
    WHERE id=?
  `).run(
    project_id || entry.project_id,
    task_id !== undefined ? task_id : entry.task_id,
    newDate, newStart, newEnd, duration,
    work_type || entry.work_type,
    description !== undefined ? description : entry.description,
    source || entry.source,
    status || entry.status,
    related_commit_ids !== undefined ? related_commit_ids : entry.related_commit_ids,
    related_clickup_task_id !== undefined ? related_clickup_task_id : entry.related_clickup_task_id,
    id
  );

  res.json(db.prepare(`
    SELECT te.*, u.full_name as user_name, p.project_name, t.task_name
    FROM time_entries te JOIN users u ON te.user_id=u.id JOIN projects p ON te.project_id=p.id
    LEFT JOIN tasks t ON te.task_id=t.id WHERE te.id=?
  `).get(id));
});

// DELETE entry
router.delete('/:id', authenticate, (req, res) => {
  const id = parseInt(req.params.id);
  const entry = db.prepare('SELECT * FROM time_entries WHERE id = ?').get(id);
  if (!entry) return res.status(404).json({ error: 'Entry not found' });
  if (req.user.role === 'employee' && entry.user_id !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  db.prepare('DELETE FROM time_entries WHERE id = ?').run(id);
  res.json({ message: 'Deleted' });
});

// ===== TIMER ROUTES =====

// Start timer
router.post('/timer/start', authenticate, (req, res) => {
  const existing = db.prepare('SELECT * FROM active_timers WHERE user_id = ?').get(req.user.id);
  if (existing) return res.status(409).json({ error: 'Timer already running' });

  const { project_id, task_id, description } = req.body;
  if (!project_id) return res.status(400).json({ error: 'project_id is required' });

  db.prepare(`
    INSERT INTO active_timers (user_id, project_id, task_id, description)
    VALUES (?, ?, ?, ?)
  `).run(req.user.id, project_id, task_id || null, description || null);

  res.json(db.prepare('SELECT * FROM active_timers WHERE user_id = ?').get(req.user.id));
});

// Stop timer
router.post('/timer/stop', authenticate, (req, res) => {
  const timer = db.prepare('SELECT * FROM active_timers WHERE user_id = ?').get(req.user.id);
  if (!timer) return res.status(404).json({ error: 'No active timer' });

  const now = new Date();
  const started = new Date(timer.started_at);
  const totalMs = now - started;
  const pausedMs = timer.paused_duration_minutes * 60 * 1000;
  const activeMins = Math.round((totalMs - pausedMs) / 60000);

  if (activeMins <= 0) {
    db.prepare('DELETE FROM active_timers WHERE user_id = ?').run(req.user.id);
    return res.status(400).json({ error: 'No time recorded' });
  }

  const today = now.toISOString().split('T')[0];
  const startStr = started.toTimeString().slice(0, 5);
  const endStr = now.toTimeString().slice(0, 5);

  const { description, related_commit_ids, related_clickup_task_id } = req.body || {};

  const result = db.prepare(`
    INSERT INTO time_entries (user_id, project_id, task_id, date, start_time, end_time, duration_minutes, description, source, status, related_commit_ids, related_clickup_task_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'timer', 'submitted', ?, ?)
  `).run(
    req.user.id, timer.project_id, timer.task_id, today, startStr, endStr, activeMins,
    description || timer.description || null,
    related_commit_ids || null, related_clickup_task_id || null
  );

  db.prepare('DELETE FROM active_timers WHERE user_id = ?').run(req.user.id);

  const entry = db.prepare(`
    SELECT te.*, u.full_name as user_name, p.project_name, t.task_name
    FROM time_entries te JOIN users u ON te.user_id=u.id JOIN projects p ON te.project_id=p.id
    LEFT JOIN tasks t ON te.task_id=t.id WHERE te.id=?
  `).get(result.lastInsertRowid);

  res.json({ entry, duration_minutes: activeMins });
});

// Pause timer
router.post('/timer/pause', authenticate, (req, res) => {
  const timer = db.prepare('SELECT * FROM active_timers WHERE user_id = ?').get(req.user.id);
  if (!timer) return res.status(404).json({ error: 'No active timer' });
  if (timer.paused_at) return res.status(409).json({ error: 'Timer already paused' });

  db.prepare("UPDATE active_timers SET paused_at=datetime('now') WHERE user_id=?").run(req.user.id);
  res.json({ message: 'Timer paused' });
});

// Resume timer
router.post('/timer/resume', authenticate, (req, res) => {
  const timer = db.prepare('SELECT * FROM active_timers WHERE user_id = ?').get(req.user.id);
  if (!timer) return res.status(404).json({ error: 'No active timer' });
  if (!timer.paused_at) return res.status(409).json({ error: 'Timer not paused' });

  const pausedAt = new Date(timer.paused_at);
  const addedMins = Math.round((new Date() - pausedAt) / 60000);

  db.prepare('UPDATE active_timers SET paused_duration_minutes=?, paused_at=NULL WHERE user_id=?')
    .run(timer.paused_duration_minutes + addedMins, req.user.id);

  res.json({ message: 'Timer resumed' });
});

// Get active timer
router.get('/timer/active', authenticate, (req, res) => {
  const timer = db.prepare(`
    SELECT at.*, p.project_name, t.task_name
    FROM active_timers at
    JOIN projects p ON at.project_id = p.id
    LEFT JOIN tasks t ON at.task_id = t.id
    WHERE at.user_id = ?
  `).get(req.user.id);
  res.json(timer || null);
});

// Discard timer
router.delete('/timer/active', authenticate, (req, res) => {
  db.prepare('DELETE FROM active_timers WHERE user_id = ?').run(req.user.id);
  res.json({ message: 'Timer discarded' });
});

module.exports = router;
