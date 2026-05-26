const { ClerkExpressRequireAuth } = require('@clerk/clerk-sdk-node');
const { fail } = require('../utils/response');
const pool = require('../config/db');

// ClerkExpressRequireAuth validates the session token and populates req.auth
const verifyToken = [
  ClerkExpressRequireAuth(),
  async (req, res, next) => {
    try {
      console.log('DEBUG [auth.js] req.auth:', JSON.stringify(req.auth));
      // Extract orgId and orgSlug from multiple potential Clerk claim formats
      const orgId = req.auth.orgId || req.auth.claims?.org_id || req.auth.sessionClaims?.org_id || req.auth.sessionClaims?.o?.id || req.auth.claims?.o?.id;
      const orgSlug = req.auth.orgSlug || req.auth.claims?.org_slug || req.auth.sessionClaims?.org_slug || req.auth.sessionClaims?.o?.slg || req.auth.claims?.o?.slg;

      // Ensure the user has selected an active organization (tenant)
      if (!orgId) {
        return fail(res, 'You must select an organization to access this resource', 403);
      }

      // Ensure the tenant exists in our DB (auto-provision if needed via webhook or on first request)
      const tenantRes = await pool.query('SELECT id FROM tenants WHERE id = $1', [orgId]);
      if (tenantRes.rows.length === 0) {
        // Auto-provision tenant on first access
        await pool.query(
          'INSERT INTO tenants (id, name) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING',
          [orgId, orgSlug || orgId]
        );
      }

      // Auto-seed mock data in development mode if there are no suppliers for this tenant yet
      if (process.env.NODE_ENV === 'development') {
        try {
          const { seedTenantData } = require('../utils/seeder');
          await seedTenantData(
            pool,
            orgId,
            req.auth.userId,
            req.auth.sessionClaims?.name || 'Demo Admin',
            req.auth.sessionClaims?.email || 'admin@ems.com'
          );
        } catch (seedErr) {
          console.error('⚠️ Failed to auto-seed tenant:', seedErr.message);
        }
      }

      // Ensure the user exists in our DB (auto-provision if needed)
      const userRes = await pool.query('SELECT id, role FROM users WHERE id = $1 AND tenant_id = $2', [req.auth.userId, orgId]);
      if (userRes.rows.length === 0) {
        // Auto-provision user on first access with default role 'sales' (or admin if it's the first creator)
        await pool.query(
          `INSERT INTO users (id, tenant_id, name, email, role)
           VALUES ($1, $2, $3, $4, 'admin')
           ON CONFLICT (id) DO UPDATE SET tenant_id = $2`,
          [req.auth.userId, orgId, req.auth.sessionClaims?.name || 'User', req.auth.sessionClaims?.email || '']
        );
      }

      // Attach tenant and user info to the request for downstream use
      const user = userRes.rows[0] || { id: req.auth.userId, role: 'sales' };
      req.user = {
        id: req.auth.userId,
        role: user.role,
        tenantId: orgId,
      };

      next();
    } catch (err) {
      next(err);
    }
  }
];

module.exports = { verifyToken };
