/**
 * Role-based Access Control + Share Links
 * Modern replacement for MMB's "password protection"
 *
 * Features:
 * - Role-based access: Owner, Editor, Viewer
 * - Shareable links with configurable permissions
 * - Token-based access (no passwords to remember)
 * - Optional expiration on share links
 * - Activity logging
 */

const crypto = require('crypto');

// Role definitions
const ROLES = {
  owner: {
    name: 'Owner',
    description: 'Full access including delete and share',
    permissions: ['read', 'write', 'delete', 'share', 'manage_access']
  },
  editor: {
    name: 'Editor',
    description: 'Can view and edit budget',
    permissions: ['read', 'write']
  },
  viewer: {
    name: 'Viewer',
    description: 'Read-only access',
    permissions: ['read']
  },
  commenter: {
    name: 'Commenter',
    description: 'Can view and add comments',
    permissions: ['read', 'comment']
  }
};

// Generate a secure share token
function generateShareToken() {
  return crypto.randomBytes(32).toString('base64url');
}

// Create production_access table if not exists
async function ensureAccessTables(pool) {
  await pool.query(`
    -- Production access for users
    CREATE TABLE IF NOT EXISTS production_access (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      production_id UUID NOT NULL REFERENCES productions(id) ON DELETE CASCADE,
      user_email VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL DEFAULT 'viewer',
      granted_by VARCHAR(255),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(production_id, user_email)
    );

    -- Share links for public/token-based access
    CREATE TABLE IF NOT EXISTS share_links (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      production_id UUID NOT NULL REFERENCES productions(id) ON DELETE CASCADE,
      token VARCHAR(255) NOT NULL UNIQUE,
      role VARCHAR(50) NOT NULL DEFAULT 'viewer',
      name VARCHAR(255),
      created_by VARCHAR(255),
      expires_at TIMESTAMP,
      max_uses INTEGER,
      use_count INTEGER DEFAULT 0,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT NOW()
    );

    -- Access log for audit
    CREATE TABLE IF NOT EXISTS access_log (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      production_id UUID NOT NULL REFERENCES productions(id) ON DELETE CASCADE,
      user_email VARCHAR(255),
      share_token VARCHAR(255),
      action VARCHAR(100) NOT NULL,
      ip_address VARCHAR(50),
      user_agent TEXT,
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_production_access_production ON production_access(production_id);
    CREATE INDEX IF NOT EXISTS idx_production_access_email ON production_access(user_email);
    CREATE INDEX IF NOT EXISTS idx_share_links_token ON share_links(token);
    CREATE INDEX IF NOT EXISTS idx_share_links_production ON share_links(production_id);
    CREATE INDEX IF NOT EXISTS idx_access_log_production ON access_log(production_id);
  `);
}

// Grant access to a user
async function grantAccess(pool, productionId, userEmail, role, grantedBy) {
  if (!ROLES[role]) {
    throw new Error(`Invalid role: ${role}`);
  }

  const result = await pool.query(`
    INSERT INTO production_access (production_id, user_email, role, granted_by)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (production_id, user_email)
    DO UPDATE SET role = $3, granted_by = $4, updated_at = NOW()
    RETURNING *
  `, [productionId, userEmail.toLowerCase(), role, grantedBy]);

  return result.rows[0];
}

// Revoke access from a user
async function revokeAccess(pool, productionId, userEmail) {
  const result = await pool.query(`
    DELETE FROM production_access
    WHERE production_id = $1 AND user_email = $2
    RETURNING *
  `, [productionId, userEmail.toLowerCase()]);

  return result.rowCount > 0;
}

// Get all users with access to a production
async function getProductionAccess(pool, productionId) {
  const result = await pool.query(`
    SELECT id, user_email, role, granted_by, created_at, updated_at
    FROM production_access
    WHERE production_id = $1
    ORDER BY role, user_email
  `, [productionId]);

  return result.rows.map(row => ({
    ...row,
    roleInfo: ROLES[row.role]
  }));
}

// Check if user has permission
async function checkPermission(pool, productionId, userEmail, permission) {
  const result = await pool.query(`
    SELECT role FROM production_access
    WHERE production_id = $1 AND user_email = $2
  `, [productionId, userEmail.toLowerCase()]);

  if (result.rows.length === 0) {
    return false;
  }

  const role = result.rows[0].role;
  return ROLES[role]?.permissions.includes(permission) || false;
}

// Get user's role for a production
async function getUserRole(pool, productionId, userEmail) {
  const result = await pool.query(`
    SELECT role FROM production_access
    WHERE production_id = $1 AND user_email = $2
  `, [productionId, userEmail.toLowerCase()]);

  if (result.rows.length === 0) {
    return null;
  }

  return {
    role: result.rows[0].role,
    ...ROLES[result.rows[0].role]
  };
}

// Create a share link
async function createShareLink(pool, productionId, options = {}) {
  const {
    role = 'viewer',
    name = null,
    createdBy = null,
    expiresIn = null, // hours
    maxUses = null
  } = options;

  if (!ROLES[role]) {
    throw new Error(`Invalid role: ${role}`);
  }

  const token = generateShareToken();
  const expiresAt = expiresIn
    ? new Date(Date.now() + expiresIn * 60 * 60 * 1000)
    : null;

  const result = await pool.query(`
    INSERT INTO share_links (production_id, token, role, name, created_by, expires_at, max_uses)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `, [productionId, token, role, name, createdBy, expiresAt, maxUses]);

  return result.rows[0];
}

// Validate and use a share link
async function validateShareLink(pool, token) {
  const result = await pool.query(`
    SELECT sl.*, p.name as production_name, p.id as production_id
    FROM share_links sl
    JOIN productions p ON sl.production_id = p.id
    WHERE sl.token = $1 AND sl.is_active = true
  `, [token]);

  if (result.rows.length === 0) {
    return { valid: false, error: 'Link not found or inactive' };
  }

  const link = result.rows[0];

  // Check expiration
  if (link.expires_at && new Date(link.expires_at) < new Date()) {
    return { valid: false, error: 'Link has expired' };
  }

  // Check max uses
  if (link.max_uses !== null && link.use_count >= link.max_uses) {
    return { valid: false, error: 'Link has reached maximum uses' };
  }

  // Increment use count
  await pool.query(`
    UPDATE share_links SET use_count = use_count + 1 WHERE id = $1
  `, [link.id]);

  return {
    valid: true,
    productionId: link.production_id,
    productionName: link.production_name,
    role: link.role,
    permissions: ROLES[link.role]?.permissions || []
  };
}

// Get all share links for a production
async function getShareLinks(pool, productionId) {
  const result = await pool.query(`
    SELECT *
    FROM share_links
    WHERE production_id = $1
    ORDER BY created_at DESC
  `, [productionId]);

  return result.rows.map(link => ({
    ...link,
    roleInfo: ROLES[link.role],
    isExpired: link.expires_at && new Date(link.expires_at) < new Date(),
    isMaxedOut: link.max_uses !== null && link.use_count >= link.max_uses
  }));
}

// Deactivate a share link
async function deactivateShareLink(pool, linkId) {
  const result = await pool.query(`
    UPDATE share_links SET is_active = false WHERE id = $1 RETURNING *
  `, [linkId]);

  return result.rowCount > 0;
}

// Log access event
async function logAccess(pool, productionId, action, options = {}) {
  const { userEmail, shareToken, ipAddress, userAgent, metadata } = options;

  await pool.query(`
    INSERT INTO access_log (production_id, user_email, share_token, action, ip_address, user_agent, metadata)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
  `, [productionId, userEmail, shareToken, action, ipAddress, userAgent, JSON.stringify(metadata || {})]);
}

// Get access log for a production
async function getAccessLog(pool, productionId, limit = 50) {
  const result = await pool.query(`
    SELECT *
    FROM access_log
    WHERE production_id = $1
    ORDER BY created_at DESC
    LIMIT $2
  `, [productionId, limit]);

  return result.rows;
}

// Get all productions user has access to
async function getUserProductions(pool, userEmail) {
  const result = await pool.query(`
    SELECT p.*, pa.role, pa.created_at as access_granted_at
    FROM productions p
    JOIN production_access pa ON p.id = pa.production_id
    WHERE pa.user_email = $1
    ORDER BY pa.created_at DESC
  `, [userEmail.toLowerCase()]);

  return result.rows.map(row => ({
    ...row,
    roleInfo: ROLES[row.role]
  }));
}

module.exports = {
  ROLES,
  generateShareToken,
  ensureAccessTables,
  grantAccess,
  revokeAccess,
  getProductionAccess,
  checkPermission,
  getUserRole,
  createShareLink,
  validateShareLink,
  getShareLinks,
  deactivateShareLink,
  logAccess,
  getAccessLog,
  getUserProductions
};
