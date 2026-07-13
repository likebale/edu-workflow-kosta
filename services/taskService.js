const { db } = require('../db/database');

// All queries use parameterized placeholders (?) to prevent SQL injection

function escapeLike(s) {
  return String(s).replace(/[\\%_]/g, ch => `\\${ch}`);
}

/**
 * Build SQL WHERE clause and parameterized values from filter conditions
 * @param {Object} filters - Filter object with optional status and search fields
 * @param {string} [filters.status] - Exact match on status column
 * @param {string} [filters.search] - Substring match on title column (wildcards are escaped)
 * @returns {Object} {sql: WHERE clause string, params: array of parameterized values}
 * @example
 * buildWhereClause({ status: 'todo', search: 'bug' })
 * // → { sql: "WHERE status = ? AND title LIKE ? ESCAPE '\\'", params: ['todo', '%bug%'] }
 */
function buildWhereClause(filters = {}) {
  const { status, search } = filters;
  const where = [];
  const params = [];

  if (status) {
    where.push('status = ?');
    params.push(status);
  }
  if (search) {
    where.push("title LIKE ? ESCAPE '\\'");
    params.push(`%${escapeLike(search)}%`);
  }

  return {
    sql: where.length ? `WHERE ${where.join(' AND ')}` : '',
    params
  };
}

function getAll(filters = {}) {
  const { page, pageSize = 20 } = filters;
  const { sql: whereSql, params } = buildWhereClause(filters);

  if (page === undefined) {
    return db.prepare(`SELECT * FROM tasks ${whereSql} ORDER BY id DESC`).all(...params);
  }

  const countResult = db.prepare(`SELECT COUNT(*) AS c FROM tasks ${whereSql}`).get(...params);
  const total = countResult ? countResult.c : 0;
  const offset = (page - 1) * pageSize;
  const data = db.prepare(
    `SELECT * FROM tasks ${whereSql} ORDER BY id DESC LIMIT ? OFFSET ?`
  ).all(...params, pageSize, offset);

  return { data, page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

function getById(id) {
  return db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
}

function create({ title, description, assignee, status }) {
  const info = db.prepare(
    'INSERT INTO tasks (title, description, assignee, status) VALUES (?, ?, ?, ?)'
  ).run(title, description || null, assignee || null, status || null);
  return getById(info.lastInsertRowid);
}

// Partial update: unspecified fields retain their existing values via COALESCE
function update(id, { title, description, status, assignee }) {
  const existing = getById(id);
  if (!existing) return null;
  db.prepare(
    `UPDATE tasks
     SET title = COALESCE(?, title),
         description = COALESCE(?, description),
         status = COALESCE(?, status),
         assignee = COALESCE(?, assignee)
     WHERE id = ?`
  ).run(title ?? null, description ?? null, status ?? null, assignee ?? null, id);
  return getById(id);
}

function remove(id) {
  const info = db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
  return info.changes > 0;
}

module.exports = { getAll, getById, create, update, remove };
