const express = require('express');
const db = require('../database/db');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, (req, res) => {
  const { project_id, assigned_to_me, status } = req.query;

  let query = `
    SELECT t.*, p.project_name, u.full_name as assigned_user_name
    FROM tasks t
    LEFT JOIN projects p ON t.project_id = p.id
    LEFT JOIN users u ON t.assigned_user_id = u.id
    WHERE 1=1
  `;
  const params = [];

  if (project_id) { query += ' AND t.project_id = ?'; params.push(project_id); }
  if (assigned_to_me === 'true') { query += ' AND t.assigned_user_id = ?'; params.push(req.user.id); }
  if (status) { query += ' AND t.status = ?'; params.push(status); }

  query += ' ORDER BY t.created_at DESC';
  res.json(db.prepare(query).all(...params));
});

router.get('/:id', authenticate, (req, res) => {
  const task = db.prepare(`
    SELECT t.*, p.project_name, u.full_name as assigned_user_name
    FROM tasks t
    LEFT JOIN projects p ON t.project_id = p.id
    LEFT JOIN users u ON t.assigned_user_id = u.id
    WHERE t.id = ?
  `).get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.json(task);
});

router.post('/', authenticate, requireRole('manager', 'admin'), (req, res) => {
  const { task_name, description, project_id, assigned_user_id, status, priority, clickup_task_id, estimated_hours, due_date } = req.body;
  if (!task_name || !project_id) return res.status(400).json({ error: 'task_name and project_id are required' });

  const result = db.prepare(`
    INSERT INTO tasks (task_name, description, project_id, assigned_user_id, status, priority, clickup_task_id, estimated_hours, due_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(task_name, description || null, project_id, assigned_user_id || null, status || 'new', priority || 'medium', clickup_task_id || null, estimated_hours || null, due_date || null);

  res.status(201).json(db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid));
});

router.put('/:id', authenticate, requireRole('manager', 'admin'), (req, res) => {
  const id = parseInt(req.params.id);
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  const { task_name, description, project_id, assigned_user_id, status, priority, clickup_task_id, estimated_hours, due_date } = req.body;
  db.prepare(`
    UPDATE tasks SET task_name=?, description=?, project_id=?, assigned_user_id=?, status=?, priority=?,
      clickup_task_id=?, estimated_hours=?, due_date=?, updated_at=datetime('now')
    WHERE id=?
  `).run(
    task_name || task.task_name,
    description !== undefined ? description : task.description,
    project_id || task.project_id,
    assigned_user_id !== undefined ? assigned_user_id : task.assigned_user_id,
    status || task.status,
    priority || task.priority,
    clickup_task_id !== undefined ? clickup_task_id : task.clickup_task_id,
    estimated_hours !== undefined ? estimated_hours : task.estimated_hours,
    due_date !== undefined ? due_date : task.due_date,
    id
  );
  res.json(db.prepare('SELECT * FROM tasks WHERE id = ?').get(id));
});

router.delete('/:id', authenticate, requireRole('manager', 'admin'), (req, res) => {
  db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
  res.json({ message: 'Task deleted' });
});

module.exports = router;
