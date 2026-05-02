/**
 * Dual-mode database adapter.
 * - Local dev  (no DATABASE_URL): uses Node 22 built-in node:sqlite (synchronous, wrapped in Promises)
 * - Production  (DATABASE_URL set): uses pg (PostgreSQL, fully async)
 *
 * Both modes expose identical async API:
 *   db.prepare(sql).get(...params)  → Promise<row | null>
 *   db.prepare(sql).all(...params)  → Promise<row[]>
 *   db.prepare(sql).run(...params)  → Promise<{ lastInsertRowid, changes }>
 *   db.exec(sql)                    → Promise<void>
 */

const USE_PG = !!process.env.DATABASE_URL;

if (USE_PG) {
  /* ── PostgreSQL mode ──────────────────────────────────────────────────── */
  const { Pool, types } = require('pg');

  // Return TIMESTAMP columns as plain strings (same format as SQLite)
  types.setTypeParser(1114, v => v);   // TIMESTAMP WITHOUT TIME ZONE
  types.setTypeParser(1184, v => v);   // TIMESTAMPTZ

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  pool.on('error', err => console.error('PG pool error', err));

  /**
   * Convert SQLite SQL to PostgreSQL:
   *  - ? → $1, $2, ...
   *  - datetime('now') → NOW()
   *  - INTEGER PRIMARY KEY AUTOINCREMENT → SERIAL PRIMARY KEY
   */
  function toPg(sql) {
    let n = 0;
    return sql
      .replace(/\?/g, () => `$${++n}`)
      .replace(/datetime\('now'\)/gi, 'NOW()')
      .replace(/INTEGER\s+PRIMARY\s+KEY\s+AUTOINCREMENT/gi, 'SERIAL PRIMARY KEY')
      .replace(/\bAUTOINCREMENT\b/gi, '');
  }

  function prepare(sql) {
    return {
      async get(...args) {
        const result = await pool.query(toPg(sql), args.flat());
        return result.rows[0] ?? null;
      },
      async all(...args) {
        const result = await pool.query(toPg(sql), args.flat());
        return result.rows;
      },
      async run(...args) {
        let pgSql = toPg(sql);
        // Append RETURNING id so we can mimic lastInsertRowid
        if (/^\s*INSERT\b/i.test(pgSql) && !/\bRETURNING\b/i.test(pgSql)) {
          pgSql += ' RETURNING id';
        }
        const result = await pool.query(pgSql, args.flat());
        return {
          lastInsertRowid: result.rows[0]?.id ?? null,
          changes: result.rowCount,
        };
      },
    };
  }

  async function exec(sql) {
    // Execute multiple statements separated by ;
    const statements = sql.split(';').map(s => s.trim()).filter(Boolean);
    for (const stmt of statements) {
      await pool.query(toPg(stmt));
    }
  }

  module.exports = { prepare, exec, isPostgres: true, pool };

} else {
  /* ── SQLite mode (local development) ─────────────────────────────────── */
  const { DatabaseSync } = require('node:sqlite');
  const path = require('path');
  const fs = require('fs');

  const DB_PATH = path.join(__dirname, '../../data/timeln.db');
  const dataDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  const sqlite = new DatabaseSync(DB_PATH);
  sqlite.exec('PRAGMA journal_mode = WAL');
  sqlite.exec('PRAGMA foreign_keys = ON');

  function prepare(sql) {
    const stmt = sqlite.prepare(sql);
    return {
      get:  (...args) => Promise.resolve(stmt.get(...args.flat()) ?? null),
      all:  (...args) => Promise.resolve(stmt.all(...args.flat())),
      run:  (...args) => Promise.resolve(stmt.run(...args.flat())),
    };
  }

  function exec(sql) {
    return Promise.resolve(sqlite.exec(sql));
  }

  module.exports = { prepare, exec, isPostgres: false };
}
