const pool = require('../db/pool');

const COLUMNS = 'id, title, completed, created_at, updated_at';

async function findAll() {
  const { rows } = await pool.query(`SELECT ${COLUMNS} FROM tasks ORDER BY id DESC`);
  return rows;
}

async function create(title) {
  const { rows } = await pool.query(
    `INSERT INTO tasks (title) VALUES ($1) RETURNING ${COLUMNS}`,
    [title]
  );
  return rows[0];
}

async function update(id, { title, completed }) {
  const { rows } = await pool.query(
    `UPDATE tasks
        SET title = COALESCE($2, title),
            completed = COALESCE($3, completed),
            updated_at = NOW()
      WHERE id = $1
      RETURNING ${COLUMNS}`,
    [id, title ?? null, completed ?? null]
  );
  return rows[0] || null;
}

async function remove(id) {
  const { rowCount } = await pool.query('DELETE FROM tasks WHERE id = $1', [id]);
  return rowCount > 0;
}

module.exports = { findAll, create, update, remove };
