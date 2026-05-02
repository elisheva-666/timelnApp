const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../database/db');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, requireRole('manager', 'admin'), async (req, res) => {
  try {
    const users = await db.prepare(
      'SELECT id, full_name, email, role, team, is_active, created_at FROM users ORDER BY full_name'
    ).all();
    res.json(users);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (req.user.role === 'employee' && req.user.id !== id) return res.status(403).json({ error: 'Forbidden' });
    const user = await db.prepare(
      'SELECT id, full_name, email, role, team, is_active, created_at FROM users WHERE id = ?'
    ).get(id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

router.post('/', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { full_name, email, password, role, team } = req.body;
    if (!full_name || !email || !password) return res.status(400).json({ error: 'full_name, email and password required' });

    const existing = await db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) return res.status(409).json({ error: 'Email already exists' });

    const hash = bcrypt.hashSync(password, 10);
    const result = await db.prepare(
      'INSERT INTO users (full_name, email, password_hash, role, team) VALUES (?, ?, ?, ?, ?)'
    ).run(full_name, email, hash, role || 'employee', team || null);

    const user = await db.prepare(
      'SELECT id, full_name, email, role, team, is_active FROM users WHERE id = ?'
    ).get(Number(result.lastInsertRowid));
    res.status(201).json(user);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

router.put('/:id', authenticate, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (req.user.role === 'employee' && req.user.id !== id) return res.status(403).json({ error: 'Forbidden' });

    const user = await db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { full_name, email, password, role, team, is_active } = req.body;
    const hash = password ? bcrypt.hashSync(password, 10) : user.password_hash;
    const newRole = req.user.role === 'admin' ? (role || user.role) : user.role;
    const newActive = req.user.role === 'admin' ? (is_active !== undefined ? is_active : user.is_active) : user.is_active;

    await db.prepare(
      `UPDATE users SET full_name=?, email=?, password_hash=?, role=?, team=?, is_active=?, updated_at=datetime('now') WHERE id=?`
    ).run(full_name || user.full_name, email || user.email, hash, newRole, team !== undefined ? team : user.team, newActive, id);

    const updated = await db.prepare('SELECT id, full_name, email, role, team, is_active FROM users WHERE id = ?').get(id);
    res.json(updated);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

router.delete('/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    await db.prepare("UPDATE users SET is_active=0, updated_at=datetime('now') WHERE id=?").run(req.params.id);
    res.json({ message: 'User deactivated' });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
