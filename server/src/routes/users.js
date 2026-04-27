const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../database/db');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET all users (manager/admin)
router.get('/', authenticate, requireRole('manager', 'admin'), (req, res) => {
  const users = db.prepare(`
    SELECT id, full_name, email, role, team, is_active, created_at FROM users ORDER BY full_name
  `).all();
  res.json(users);
});

// GET single user
router.get('/:id', authenticate, (req, res) => {
  const id = parseInt(req.params.id);
  if (req.user.role === 'employee' && req.user.id !== id) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const user = db.prepare('SELECT id, full_name, email, role, team, is_active, created_at FROM users WHERE id = ?').get(id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

// POST create user (admin only)
router.post('/', authenticate, requireRole('admin'), (req, res) => {
  const { full_name, email, password, role, team } = req.body;
  if (!full_name || !email || !password) {
    return res.status(400).json({ error: 'full_name, email and password are required' });
  }
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return res.status(409).json({ error: 'Email already exists' });

  const hash = bcrypt.hashSync(password, 10);
  const result = db.prepare(`
    INSERT INTO users (full_name, email, password_hash, role, team) VALUES (?, ?, ?, ?, ?)
  `).run(full_name, email, hash, role || 'employee', team || null);

  const user = db.prepare('SELECT id, full_name, email, role, team, is_active FROM users WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(user);
});

// PUT update user (admin or self)
router.put('/:id', authenticate, (req, res) => {
  const id = parseInt(req.params.id);
  if (req.user.role === 'employee' && req.user.id !== id) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { full_name, email, password, role, team, is_active } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const hash = password ? bcrypt.hashSync(password, 10) : user.password_hash;
  const newRole = req.user.role === 'admin' ? (role || user.role) : user.role;
  const newActive = req.user.role === 'admin' ? (is_active !== undefined ? is_active : user.is_active) : user.is_active;

  db.prepare(`
    UPDATE users SET full_name=?, email=?, password_hash=?, role=?, team=?, is_active=?, updated_at=datetime('now')
    WHERE id=?
  `).run(full_name || user.full_name, email || user.email, hash, newRole, team !== undefined ? team : user.team, newActive, id);

  const updated = db.prepare('SELECT id, full_name, email, role, team, is_active FROM users WHERE id = ?').get(id);
  res.json(updated);
});

// DELETE (deactivate) user (admin)
router.delete('/:id', authenticate, requireRole('admin'), (req, res) => {
  const id = parseInt(req.params.id);
  db.prepare("UPDATE users SET is_active=0, updated_at=datetime('now') WHERE id=?").run(id);
  res.json({ message: 'User deactivated' });
});

module.exports = router;
