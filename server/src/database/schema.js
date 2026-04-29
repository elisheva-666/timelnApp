const db = require('./db');

function initializeSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS organizations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'employee' CHECK(role IN ('employee','manager','admin')),
      team TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_name TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','inactive','archived')),
      manager_id INTEGER REFERENCES users(id),
      external_clickup_list_id TEXT,
      external_clickup_space_id TEXT,
      git_repository_name TEXT,
      git_repository_url TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_name TEXT NOT NULL,
      description TEXT,
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      assigned_user_id INTEGER REFERENCES users(id),
      status TEXT NOT NULL DEFAULT 'new' CHECK(status IN ('new','in_progress','completed','cancelled')),
      priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('low','medium','high','urgent')),
      clickup_task_id TEXT,
      estimated_hours REAL,
      due_date TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS time_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      project_id INTEGER NOT NULL REFERENCES projects(id),
      task_id INTEGER REFERENCES tasks(id),
      date TEXT NOT NULL,
      start_time TEXT,
      end_time TEXT,
      duration_minutes INTEGER NOT NULL,
      work_type TEXT DEFAULT 'development',
      description TEXT,
      source TEXT NOT NULL DEFAULT 'manual' CHECK(source IN ('manual','timer','git','clickup','suggested')),
      status TEXT NOT NULL DEFAULT 'submitted' CHECK(status IN ('draft','submitted','approved','rejected')),
      related_commit_ids TEXT,
      related_clickup_task_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS active_timers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL REFERENCES users(id),
      project_id INTEGER NOT NULL REFERENCES projects(id),
      task_id INTEGER REFERENCES tasks(id),
      started_at TEXT NOT NULL DEFAULT (datetime('now')),
      paused_duration_minutes INTEGER NOT NULL DEFAULT 0,
      paused_at TEXT,
      description TEXT
    );
  `);
  // Safe migrations: add org_id columns to existing tables
  try { db.exec('ALTER TABLE users ADD COLUMN org_id INTEGER REFERENCES organizations(id)'); } catch {}
  try { db.exec('ALTER TABLE projects ADD COLUMN org_id INTEGER REFERENCES organizations(id)'); } catch {}

  // Ensure default organization exists
  const existing = db.prepare('SELECT id FROM organizations LIMIT 1').get();
  if (!existing) {
    db.prepare("INSERT INTO organizations (name, slug) VALUES ('Default Organization', 'default')").run();
  }

  console.log('Database schema initialized');
}

module.exports = { initializeSchema };
