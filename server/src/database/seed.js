const bcrypt = require('bcryptjs');
const db = require('./db');
const { initializeSchema } = require('./schema');

async function seed() {
  await initializeSchema();

  const password = bcrypt.hashSync('password123', 10);

  async function upsertUser(full_name, email, role, team) {
    const existing = await db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) return existing.id;
    const r = await db.prepare(
      'INSERT INTO users (full_name, email, password_hash, role, team) VALUES (?, ?, ?, ?, ?)'
    ).run(full_name, email, password, role, team);
    return r.lastInsertRowid;
  }

  await upsertUser('מנהל ראשי', 'admin@timeln.com', 'admin', 'הנהלה');
  const saraId   = await upsertUser('שרה כהן',    'sara@timeln.com',   'manager',  'פיתוח');
  const davidId  = await upsertUser('דוד לוי',    'david@timeln.com',  'employee', 'פיתוח');
  const michalId = await upsertUser('מיכל אברהם', 'michal@timeln.com', 'employee', 'פיתוח');
  await upsertUser('יוסי ברכה', 'yosi@timeln.com', 'employee', 'עיצוב');

  async function upsertProject(project_name, description, status, managerId, git_name) {
    const existing = await db.prepare('SELECT id FROM projects WHERE project_name = ?').get(project_name);
    if (existing) return existing.id;
    const r = await db.prepare(
      'INSERT INTO projects (project_name, description, status, manager_id, git_repository_name) VALUES (?, ?, ?, ?, ?)'
    ).run(project_name, description, status, managerId, git_name || null);
    return r.lastInsertRowid;
  }

  const proj1Id = await upsertProject('TimeIn App',     'פיתוח אפליקציית דיווח שעות', 'active', saraId, 'timeln-app');
  const proj2Id = await upsertProject('אתר חברה',       'עיצוב ופיתוח אתר החברה',      'active', saraId, 'company-website');
  await upsertProject('ניהול לקוחות', 'מערכת CRM פנימית', 'active', saraId, null);

  async function upsertTask(task_name, description, project_id, assigned_user_id, status, priority, estimated_hours) {
    const existing = await db.prepare('SELECT id FROM tasks WHERE task_name = ? AND project_id = ?').get(task_name, project_id);
    if (existing) return existing.id;
    const r = await db.prepare(
      'INSERT INTO tasks (task_name, description, project_id, assigned_user_id, status, priority, estimated_hours) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(task_name, description, project_id, assigned_user_id, status, priority, estimated_hours);
    return r.lastInsertRowid;
  }

  const task1Id = await upsertTask('הקמת Backend',    'Node.js + Express + SQLite', proj1Id, davidId,  'completed',   'high',   20);
  const task2Id = await upsertTask('פיתוח Frontend',  'React + Vite + Tailwind',    proj1Id, davidId,  'in_progress', 'high',   30);
  const task3Id = await upsertTask('עיצוב UI',        'Figma mockups ועיצוב',       proj1Id, michalId, 'completed',   'medium', 15);
  await upsertTask('דף הבית',  'עיצוב דף הבית של האתר', proj2Id, michalId, 'in_progress', 'medium', 8);
  await upsertTask('בדיקות QA', 'בדיקות מקצה לקצה',      proj1Id, davidId,  'new',         'medium', 10);

  // Seed 7 days of time entries (skip Fri/Sat)
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const day = d.getDay();
    if (day === 5 || day === 6) continue;
    const dateStr = d.toISOString().split('T')[0];

    const checkEntry = await db.prepare(
      'SELECT id FROM time_entries WHERE user_id = ? AND date = ? AND start_time = ?'
    ).get(davidId, dateStr, '09:00');
    if (checkEntry) continue;

    await db.prepare(
      'INSERT INTO time_entries (user_id, project_id, task_id, date, start_time, end_time, duration_minutes, description, source, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(davidId,  proj1Id, task1Id, dateStr, '09:00', '12:00', 180, 'עבודה על Backend API', 'manual', 'submitted');
    await db.prepare(
      'INSERT INTO time_entries (user_id, project_id, task_id, date, start_time, end_time, duration_minutes, description, source, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(davidId,  proj1Id, task2Id, dateStr, '13:00', '17:00', 240, 'פיתוח קומפוננטות React', 'manual', 'submitted');
    await db.prepare(
      'INSERT INTO time_entries (user_id, project_id, task_id, date, start_time, end_time, duration_minutes, description, source, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(michalId, proj1Id, task3Id, dateStr, '10:00', '13:00', 180, 'עיצוב מסכים', 'manual', 'submitted');
    await db.prepare(
      'INSERT INTO time_entries (user_id, project_id, task_id, date, start_time, end_time, duration_minutes, description, source, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(michalId, proj2Id, null,    dateStr, '14:00', '16:00', 120, 'עבודה על אתר החברה', 'manual', 'submitted');
  }

  console.log('\nDatabase seeded successfully!');
  console.log('  admin@timeln.com  / password123  (Admin)');
  console.log('  sara@timeln.com   / password123  (Manager)');
  console.log('  david@timeln.com  / password123  (Employee)');
  console.log('  michal@timeln.com / password123  (Employee)');
}

seed().catch(err => { console.error('Seed failed:', err); process.exit(1); });
