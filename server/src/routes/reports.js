const express = require('express');
const db = require('../database/db');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

// Summary for employee dashboard
router.get('/my-summary', authenticate, (req, res) => {
  const userId = req.user.id;
  const today = new Date().toISOString().split('T')[0];
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekStartStr = weekStart.toISOString().split('T')[0];
  const monthStart = today.slice(0, 7) + '-01';

  const todayHours = db.prepare('SELECT COALESCE(SUM(duration_minutes),0) as total FROM time_entries WHERE user_id=? AND date=?').get(userId, today);
  const weekHours = db.prepare('SELECT COALESCE(SUM(duration_minutes),0) as total FROM time_entries WHERE user_id=? AND date>=?').get(userId, weekStartStr);
  const monthHours = db.prepare('SELECT COALESCE(SUM(duration_minutes),0) as total FROM time_entries WHERE user_id=? AND date>=?').get(userId, monthStart);

  const byProject = db.prepare(`
    SELECT p.project_name, COALESCE(SUM(te.duration_minutes),0) as total_minutes
    FROM time_entries te JOIN projects p ON te.project_id=p.id
    WHERE te.user_id=? AND te.date>=?
    GROUP BY p.id, p.project_name ORDER BY total_minutes DESC
  `).all(userId, monthStart);

  const recent = db.prepare(`
    SELECT te.*, p.project_name, t.task_name
    FROM time_entries te JOIN projects p ON te.project_id=p.id
    LEFT JOIN tasks t ON te.task_id=t.id
    WHERE te.user_id=?
    ORDER BY te.date DESC, te.created_at DESC LIMIT 10
  `).all(userId);

  res.json({
    today_minutes: todayHours.total,
    week_minutes: weekHours.total,
    month_minutes: monthHours.total,
    by_project: byProject,
    recent_entries: recent
  });
});

// Manager overview
router.get('/overview', authenticate, requireRole('manager', 'admin'), (req, res) => {
  const { date_from, date_to } = req.query;
  const from = date_from || new Date(new Date().setDate(1)).toISOString().split('T')[0];
  const to = date_to || new Date().toISOString().split('T')[0];

  const byUser = db.prepare(`
    SELECT u.id, u.full_name, u.team,
      COALESCE(SUM(te.duration_minutes),0) as total_minutes,
      COUNT(te.id) as entry_count
    FROM users u
    LEFT JOIN time_entries te ON u.id=te.user_id AND te.date BETWEEN ? AND ?
    WHERE u.is_active=1 AND u.role='employee'
    GROUP BY u.id, u.full_name, u.team
    ORDER BY total_minutes DESC
  `).all(from, to);

  const byProject = db.prepare(`
    SELECT p.id, p.project_name,
      COALESCE(SUM(te.duration_minutes),0) as total_minutes,
      COUNT(DISTINCT te.user_id) as user_count,
      COUNT(te.id) as entry_count
    FROM projects p
    LEFT JOIN time_entries te ON p.id=te.project_id AND te.date BETWEEN ? AND ?
    GROUP BY p.id, p.project_name
    ORDER BY total_minutes DESC
  `).all(from, to);

  const total = db.prepare(`
    SELECT COALESCE(SUM(duration_minutes),0) as total FROM time_entries WHERE date BETWEEN ? AND ?
  `).get(from, to);

  res.json({ by_user: byUser, by_project: byProject, total_minutes: total.total, date_from: from, date_to: to });
});

// Report: hours by user
router.get('/by-user', authenticate, requireRole('manager', 'admin'), (req, res) => {
  const { user_id, date_from, date_to } = req.query;
  const from = date_from || new Date(new Date().setDate(1)).toISOString().split('T')[0];
  const to = date_to || new Date().toISOString().split('T')[0];

  let query = `
    SELECT te.date, te.duration_minutes, te.description, te.start_time, te.end_time,
      p.project_name, t.task_name, u.full_name as user_name, te.id,
      te.related_commit_ids, te.related_clickup_task_id, te.source
    FROM time_entries te
    JOIN users u ON te.user_id=u.id
    JOIN projects p ON te.project_id=p.id
    LEFT JOIN tasks t ON te.task_id=t.id
    WHERE te.date BETWEEN ? AND ?
  `;
  const params = [from, to];
  if (user_id) { query += ' AND te.user_id=?'; params.push(user_id); }
  query += ' ORDER BY te.date DESC, te.start_time DESC';

  res.json(db.prepare(query).all(...params));
});

// Report: hours by project
router.get('/by-project', authenticate, requireRole('manager', 'admin'), (req, res) => {
  const { project_id, date_from, date_to } = req.query;
  const from = date_from || new Date(new Date().setDate(1)).toISOString().split('T')[0];
  const to = date_to || new Date().toISOString().split('T')[0];

  const taskBreakdown = db.prepare(`
    SELECT t.task_name, COALESCE(SUM(te.duration_minutes),0) as total_minutes,
      COUNT(DISTINCT te.user_id) as users
    FROM time_entries te
    LEFT JOIN tasks t ON te.task_id=t.id
    WHERE te.date BETWEEN ? AND ? ${project_id ? 'AND te.project_id=?' : ''}
    GROUP BY te.task_id, t.task_name
    ORDER BY total_minutes DESC
  `).all(...(project_id ? [from, to, project_id] : [from, to]));

  const userBreakdown = db.prepare(`
    SELECT u.full_name, COALESCE(SUM(te.duration_minutes),0) as total_minutes
    FROM time_entries te JOIN users u ON te.user_id=u.id
    WHERE te.date BETWEEN ? AND ? ${project_id ? 'AND te.project_id=?' : ''}
    GROUP BY te.user_id, u.full_name
    ORDER BY total_minutes DESC
  `).all(...(project_id ? [from, to, project_id] : [from, to]));

  res.json({ task_breakdown: taskBreakdown, user_breakdown: userBreakdown });
});

// Anomalies report
router.get('/anomalies', authenticate, requireRole('manager', 'admin'), (req, res) => {
  const { date_from, date_to } = req.query;
  const from = date_from || new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0];
  const to = date_to || new Date().toISOString().split('T')[0];

  // Long entries (>10 hours)
  const longEntries = db.prepare(`
    SELECT te.*, u.full_name as user_name, p.project_name
    FROM time_entries te JOIN users u ON te.user_id=u.id JOIN projects p ON te.project_id=p.id
    WHERE te.date BETWEEN ? AND ? AND te.duration_minutes > 600
    ORDER BY te.duration_minutes DESC
  `).all(from, to);

  // Days with high hours (>10h per user per day)
  const heavyDays = db.prepare(`
    SELECT te.date, te.user_id, u.full_name, SUM(te.duration_minutes) as total
    FROM time_entries te JOIN users u ON te.user_id=u.id
    WHERE te.date BETWEEN ? AND ?
    GROUP BY te.date, te.user_id
    HAVING total > 600
    ORDER BY total DESC
  `).all(from, to);

  // Users with zero entries in period
  const noEntryUsers = db.prepare(`
    SELECT u.id, u.full_name, u.team
    FROM users u
    WHERE u.is_active=1 AND u.role='employee'
      AND u.id NOT IN (
        SELECT DISTINCT user_id FROM time_entries WHERE date BETWEEN ? AND ?
      )
  `).all(from, to);

  // Overlapping entries (same user, same day, overlapping times)
  const overlaps = db.prepare(`
    SELECT a.id as id_a, b.id as id_b,
      u.full_name, a.date, a.start_time, a.end_time,
      b.start_time as b_start, b.end_time as b_end
    FROM time_entries a
    JOIN time_entries b ON a.user_id=b.user_id AND a.date=b.date AND a.id < b.id
    JOIN users u ON a.user_id=u.id
    WHERE a.date BETWEEN ? AND ?
      AND a.start_time IS NOT NULL AND a.end_time IS NOT NULL
      AND b.start_time IS NOT NULL AND b.end_time IS NOT NULL
      AND a.start_time < b.end_time AND a.end_time > b.start_time
    ORDER BY a.date DESC
    LIMIT 50
  `).all(from, to);

  res.json({ long_entries: longEntries, heavy_days: heavyDays, no_entry_users: noEntryUsers, overlaps });
});

// Drill-down: all entries for a specific user
router.get('/drill/user/:userId', authenticate, requireRole('manager', 'admin'), (req, res) => {
  const { date_from, date_to } = req.query;
  const from = date_from || new Date(new Date().setDate(1)).toISOString().split('T')[0];
  const to = date_to || new Date().toISOString().split('T')[0];

  const entries = db.prepare(`
    SELECT te.id, te.date, te.duration_minutes, te.start_time, te.end_time,
      te.description, te.status, te.work_type, te.related_commit_ids,
      p.project_name, t.task_name
    FROM time_entries te
    JOIN projects p ON te.project_id=p.id
    LEFT JOIN tasks t ON te.task_id=t.id
    WHERE te.user_id=? AND te.date BETWEEN ? AND ?
    ORDER BY te.date DESC, te.start_time DESC
  `).all(req.params.userId, from, to);

  res.json(entries);
});

// Drill-down: all entries for a specific project
router.get('/drill/project/:projectId', authenticate, requireRole('manager', 'admin'), (req, res) => {
  const { date_from, date_to } = req.query;
  const from = date_from || new Date(new Date().setDate(1)).toISOString().split('T')[0];
  const to = date_to || new Date().toISOString().split('T')[0];

  const entries = db.prepare(`
    SELECT te.id, te.date, te.duration_minutes, te.start_time, te.end_time,
      te.description, te.status, te.work_type,
      u.full_name as user_name, t.task_name
    FROM time_entries te
    JOIN users u ON te.user_id=u.id
    LEFT JOIN tasks t ON te.task_id=t.id
    WHERE te.project_id=? AND te.date BETWEEN ? AND ?
    ORDER BY te.date DESC, te.start_time DESC
  `).all(req.params.projectId, from, to);

  res.json(entries);
});

module.exports = router;
