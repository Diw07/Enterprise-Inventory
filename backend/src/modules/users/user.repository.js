const pool = require('../../config/db');

class UserRepository {
  async findByEmail(email) {
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND is_active = TRUE',
      [email]
    );
    return rows[0] || null;
  }

  async findById(id) {
    const { rows } = await pool.query(
      'SELECT id, name, email, role, is_active, created_at FROM users WHERE id = $1',
      [id]
    );
    return rows[0] || null;
  }

  async findAll() {
    const { rows } = await pool.query(
      'SELECT id, name, email, role, is_active, created_at FROM users ORDER BY created_at DESC'
    );
    return rows;
  }

  async create({ name, email, password_hash, role }) {
    const { rows } = await pool.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role, created_at`,
      [name, email, password_hash, role]
    );
    return rows[0];
  }

  async updateRefreshToken(id, token) {
    await pool.query('UPDATE users SET refresh_token = $1 WHERE id = $2', [token, id]);
  }

  async getRefreshToken(id) {
    const { rows } = await pool.query('SELECT refresh_token FROM users WHERE id = $1', [id]);
    return rows[0]?.refresh_token || null;
  }

  async updateRole(id, role) {
    const { rows } = await pool.query(
      'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, name, email, role',
      [role, id]
    );
    return rows[0] || null;
  }

  async setActive(id, is_active) {
    const { rows } = await pool.query(
      'UPDATE users SET is_active = $1 WHERE id = $2 RETURNING id, name, email, role, is_active',
      [is_active, id]
    );
    return rows[0] || null;
  }
}

module.exports = new UserRepository();
