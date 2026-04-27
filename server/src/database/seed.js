const bcrypt = require('bcryptjs');
const db = require('./db');
const { initializeSchema } = require('./schema');

initializeSchema();

const password = bcrypt.hashSync('password123', 10);

// Seed users
const insertUser = db.prepare(`
  INSERT OR IGNORE INTO users (full_name, email, password_hash, role, team)
  VALUES (?, ?, ?, ?, ?)
`);

insertUser.run('מנהל ראשי', 'admin@timeln.com', password, 'admin', 'הנהלה');
insertUser.run('שרה כהן', 'sara@timeln.com', password, 'manager', 'פיתוח');
insertUser.run('דוד לוי', 'david@timeln.com', password, 'employee', 'פיתוח');
insertUser.run('מיכל אברהם', 'michal@timeln.com', password, 'employee', 'פיתוח');
insertUser.run('יוסי ברכה', 'yosi@timeln.com', password, 'employee', 'עיצוב');

// Seed projects
const insertProject = db.prepare(`
  INSERT OR IGNORE INTO projects (project_name, description, status, manager_id, git_repository_name)
  VALUES (?, ?, ?, ?, ?)
`);

const manager = db.prepare('SELECT id FROM users WHERE email = ?').get('sara@timeln.com');

insertProject.run('TimeIn App', 'פיתוח אפליקציית דיווח שעות', 'active', manager.id, 'timeln-app');
insertProject.run('אתר חברה', 'עיצוב ופיתוח אתר החברה', 'active', manager.id, 'company-website');
insertProject.run('ניהול לקוחות', 'מערכת CRM פנימית', 'active', manager.id, null);

// Seed tasks
const proj1 = db.prepare('SELECT id FROM projects WHERE project_name = ?').get('TimeIn App');
const proj2 = db.prepare('SELECT id FROM projects WHERE project_name = ?').get('אתר חברה');
const david = db.prepare('SELECT id FROM users WHERE email = ?').get('david@timeln.com');
const michal = db.prepare('SELECT id FROM users WHERE email = ?').get('michal@timeln.com');

const insertTask = db.prepare(`
  INSERT OR IGNORE INTO tasks (task_name, description, project_id, assigned_user_id, status, priority, estimated_hours)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

insertTask.run('הקמת Backend', 'Node.js + Express + SQLite', proj1.id, david.id, 'completed', 'high', 20);
insertTask.run('פיתוח Frontend', 'React + Vite + Tailwind', proj1.id, david.id, 'in_progress', 'high', 30);
insertTask.run('עיצוב UI', 'Figma mockups ועיצוב', proj1.id, michal.id, 'completed', 'medium', 15);
insertTask.run('דף הבית', 'עיצוב דף הבית של האתר', proj2.id, michal.id, 'in_progress', 'medium', 8);
insertTask.run('בדיקות QA', 'בדיקות מקצה לקצה', proj1.id, david.id, 'new', 'medium', 10);

// Seed time entries (last 7 days)
const insertEntry = db.prepare(`
  INSERT INTO time_entries (user_id, project_id, task_id, date, start_time, end_time, duration_minutes, description, source, status)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'manual', 'submitted')
`);

const task1 = db.prepare('SELECT id FROM tasks WHERE task_name = ?').get('הקמת Backend');
const task2 = db.prepare('SELECT id FROM tasks WHERE task_name = ?').get('פיתוח Frontend');
const task3 = db.prepare('SELECT id FROM tasks WHERE task_name = ?').get('עיצוב UI');

const today = new Date();
for (let i = 6; i >= 0; i--) {
  const d = new Date(today);
  d.setDate(d.getDate() - i);
  const dateStr = d.toISOString().split('T')[0];

  if (d.getDay() !== 5 && d.getDay() !== 6) { // skip Friday/Saturday (Israeli weekend)
    insertEntry.run(david.id, proj1.id, task1.id, dateStr, '09:00', '12:00', 180, 'עבודה על Backend API', );
    insertEntry.run(david.id, proj1.id, task2.id, dateStr, '13:00', '17:00', 240, 'פיתוח קומפוננטות React');
    insertEntry.run(michal.id, proj1.id, task3.id, dateStr, '10:00', '13:00', 180, 'עיצוב מסכים');
    insertEntry.run(michal.id, proj2.id, null, dateStr, '14:00', '16:00', 120, 'עבודה על אתר החברה');
  }
}

console.log('Database seeded successfully!');
console.log('Users:');
console.log('  admin@timeln.com / password123 (Admin)');
console.log('  sara@timeln.com  / password123 (Manager)');
console.log('  david@timeln.com / password123 (Employee)');
console.log('  michal@timeln.com / password123 (Employee)');
