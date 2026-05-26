const pool = require('../../config/db');

class UserRepository {
  async findByEmail(email, tenantId) {
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND tenant_id = $2 AND is_active = TRUE',
      [email, tenantId]
    );
    return rows[0] || null;
  }

  async findById(id, tenantId) {
    const { rows } = await pool.query(
      'SELECT id, name, email, role, is_active, created_at FROM users WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );
    return rows[0] || null;
  }

  async findAll(tenantId) {
    const { rows } = await pool.query(
      'SELECT id, name, email, role, is_active, created_at FROM users WHERE tenant_id = $1 ORDER BY created_at DESC',
      [tenantId]
    );
    return rows;
  }

  async create({ name, email, role, tenantId }, client = pool) {
    const { rows } = await client.query(
      `INSERT INTO users (id, tenant_id, name, email, role)
       VALUES (uuid_generate_v4()::text, $1, $2, $3, $4)
       RETURNING id, name, email, role, created_at`,
      [tenantId, name, email, role]
    );
    return rows[0];
  }

  async updateRole(id, role, tenantId) {
    const { rows } = await pool.query(
      'UPDATE users SET role = $1 WHERE id = $2 AND tenant_id = $3 RETURNING id, name, email, role',
      [role, id, tenantId]
    );
    return rows[0] || null;
  }

  async setActive(id, is_active, tenantId) {
    const { rows } = await pool.query(
      'UPDATE users SET is_active = $1 WHERE id = $2 AND tenant_id = $3 RETURNING id, name, email, role, is_active',
      [is_active, id, tenantId]
    );
    return rows[0] || null;
  }
}

module.exports = new UserRepository();
