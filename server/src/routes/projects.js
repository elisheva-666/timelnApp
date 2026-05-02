const express = require('express');
const db = require('../database/db');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const projects = await db.prepare(`
      SELECT p.*, u.full_name as manager_name
      FROM projects p LEFT JOIN users u ON p.manager_id = u.id
      WHERE p.status != 'archived' ORDER BY p.project_name
    `).all();
    res.json(projects);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const project = await db.prepare(`
      SELECT p.*, u.full_name as manager_name
      FROM projects p LEFT JOIN users u ON p.manager_id = u.id WHERE p.id = ?
    `).get(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

router.post('/', authenticate, requireRole('manager', 'admin'), async (req, res) => {
  try {
    const { project_name, description, status, manager_id, external_clickup_list_id, git_repository_name, git_repository_url } = req.body;
    if (!project_name) return res.status(400).json({ error: 'project_name is required' });

    const result = await db.prepare(`
      INSERT INTO projects (project_name, description, status, manager_id, external_clickup_list_id, git_repository_name, git_repository_url)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(project_name, description || null, status || 'active', manager_id || null, external_clickup_list_id || null, git_repository_name || null, git_repository_url || null);

    const project = await db.prepare('SELECT * FROM projects WHERE id = ?').get(Number(result.lastInsertRowid));
    res.status(201).json(project);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

router.put('/:id', authenticate, requireRole('manager', 'admin'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const proj = await db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
    if (!proj) return res.status(404).json({ error: 'Project not found' });

    const { project_name, description, status, manager_id, external_clickup_list_id, git_repository_name, git_repository_url } = req.body;
    await db.prepare(`
      UPDATE projects SET project_name=?, description=?, status=?, manager_id=?,
        external_clickup_list_id=?, git_repository_name=?, git_repository_url=?, updated_at=datetime('now')
      WHERE id=?
    `).run(
      project_name || proj.project_name,
      description !== undefined ? description : proj.description,
      status || proj.status,
      manager_id !== undefined ? manager_id : proj.manager_id,
      external_clickup_list_id !== undefined ? external_clickup_list_id : proj.external_clickup_list_id,
      git_repository_name !== undefined ? git_repository_name : proj.git_repository_name,
      git_repository_url !== undefined ? git_repository_url : proj.git_repository_url,
      id
    );

    res.json(await db.prepare('SELECT * FROM projects WHERE id = ?').get(id));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

router.delete('/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    await db.prepare("UPDATE projects SET status='archived', updated_at=datetime('now') WHERE id=?").run(req.params.id);
    res.json({ message: 'Project archived' });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
