const bcrypt = require('bcryptjs');
const db = require('./db');
const { initializeSchema } = require('./schema');

initializeSchema();

const password = bcrypt.hashSync('password123', 10);

const insertUser = db.prepare(`
  INSERT OR IGNORE INTO users (full_name, email, password_hash, role, team)
  VALUES (?, ?, ?, ?, ?)
`);

insertUser.run('מנהל ראשי', 'admin@timeln.com', password, 'admin', 'הנהלה');
insertUser.run('שרה כהן', 'sara@timeln.com', password, 'manager', 'פיתוח');
insertUser.run('דוד לוי', 'david@timeln.com', password, 'employee', 'פיתוח');
insertUser.run('מיכל אברהם', 'michal@timeln.com', password, 'employee', 'פיתוח');
insertUser.run('יוסי ברכה', 'yosi@timeln.com', password, 'employee', 'עיצוב');

const insertProject = db.prepare(`
  INSERT OR IGNORE INTO projects (project_name, description, status, manager_id, git_repository_name)
  VALUES (?, ?, ?, ?, ?)
`);

const manager = db.prepare('SELECT id FROM users WHERE email = ?').get('sara@timeln.com');
const managerId = Number(manager.id);

insertProject.run('TimeIn App', 'פיתוח אפליקציית דיווח שעות', 'active', managerId, 'timeln-app');
insertProject.run('אתר חברה', 'עיצוב ופיתוח אתר החברה', 'active', managerId, 'company-website');
insertProject.run('ניהול לקוחות', 'מערכת CRM פנימית', 'active', managerId, null);

const proj1 = db.prepare('SELECT id FROM projects WHERE project_name = ?').get('TimeIn App');
const proj2 = db.prepare('SELECT id FROM projects WHERE project_name = ?').get('אתר חברה');
const david = db.prepare('SELECT id FROM users WHERE email = ?').get('david@timeln.com');
const michal = db.prepare('SELECT id FROM users WHERE email = ?').get('michal@timeln.com');

const proj1Id = Number(proj1.id);
const proj2Id = Number(proj2.id);
const davidId = Number(david.id);
const michalId = Number(michal.id);

const insertTask = db.prepare(`
  INSERT OR IGNORE INTO tasks (task_name, description, project_id, assigned_user_id, status, priority, estimated_hours)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

insertTask.run('הקמת Backend', 'Node.js + Express + SQLite', proj1Id, davidId, 'completed', 'high', 20);
insertTask.run('פיתוח Frontend', 'React + Vite + Tailwind', proj1Id, davidId, 'in_progress', 'high', 30);
insertTask.run('עיצוב UI', 'Figma mockups ועיצוב', proj1Id, michalId, 'completed', 'medium', 15);
insertTask.run('דף הבית', 'עיצוב דף הבית של האתר', proj2Id, michalId, 'in_progress', 'medium', 8);
insertTask.run('בדיקות QA', 'בדיקות מקצה לקצה', proj1Id, davidId, 'new', 'medium', 10);

const task1 = db.prepare("SELECT id FROM tasks WHERE task_name = ?").get('הקמת Backend');
const task2 = db.prepare("SELECT id FROM tasks WHERE task_name = ?").get('פיתוח Frontend');
const task3 = db.prepare("SELECT id FROM tasks WHERE task_name = ?").get('עיצוב UI');
const task1Id = Number(task1.id);
const task2Id = Number(task2.id);
const task3Id = Number(task3.id);

const insertEntry = db.prepare(`
  INSERT INTO time_entries (user_id, project_id, task_id, date, start_time, end_time, duration_minutes, description, source, status)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'manual', 'submitted')
`);

const today = new Date();
for (let i = 6; i >= 0; i--) {
  const d = new Date(today);
  d.setDate(d.getDate() - i);
  const dateStr = d.toISOString().split('T')[0];
  if (d.getDay() !== 5 && d.getDay() !== 6) {
    insertEntry.run(davidId, proj1Id, task1Id, dateStr, '09:00', '12:00', 180, 'עבודה על Backend API');
    insertEntry.run(davidId, proj1Id, task2Id, dateStr, '13:00', '17:00', 240, 'פיתוח קומפוננטות React');
    insertEntry.run(michalId, proj1Id, task3Id, dateStr, '10:00', '13:00', 180, 'עיצוב מסכים');
    insertEntry.run(michalId, proj2Id, null, dateStr, '14:00', '16:00', 120, 'עבודה על אתר החברה');
  }
}

console.log('Database seeded successfully!');
console.log('  admin@timeln.com / password123 (Admin)');
console.log('  sara@timeln.com  / password123 (Manager)');
console.log('  david@timeln.com / password123 (Employee)');
console.log('  michal@timeln.com / password123 (Employee)');
