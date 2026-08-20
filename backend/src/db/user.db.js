const pool = require('./pool');

function toUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    role: row.role,
    createdAt: row.created_at,
  };
}

async function findByEmail(email) {
  const { rows } = await pool.query(
    'SELECT id, email, password_hash, role, created_at FROM users WHERE email = $1',
    [email]
  );
  return toUser(rows[0]);
}

async function findById(id) {
  const { rows } = await pool.query(
    'SELECT id, email, password_hash, role, created_at FROM users WHERE id = $1',
    [id]
  );
  return toUser(rows[0]);
}

async function create({ email, passwordHash }) {
  const { rows } = await pool.query(
    'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, role, created_at',
    [email, passwordHash]
  );
  const row = rows[0];
  return { id: row.id, email: row.email, role: row.role, createdAt: row.created_at };
}

module.exports = { findByEmail, findById, create };
