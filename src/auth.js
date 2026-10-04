const crypto = require('node:crypto');
const { db } = require('./db');

const ITERATIONS = 100000;
const KEY_LEN = 64;
const DIGEST = 'sha512';
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

function hashPassword(password, salt) {
  if (!salt) {
    salt = crypto.randomBytes(16).toString('hex');
  }
  const hash = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LEN, DIGEST).toString('hex');
  return { hash, salt };
}

function verifyPassword(password, hash, salt) {
  const check = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LEN, DIGEST).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(check, 'hex'), Buffer.from(hash, 'hex'));
}

function createSession(adminUserId) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  
  const insert = db.prepare(`
    INSERT INTO sessions (token, admin_user_id, expires_at)
    VALUES (?, ?, ?)
  `);
  insert.run(token, adminUserId, expiresAt);

  return { token, expiresAt };
}

function validateSession(token) {
  if (!token) return null;
  const now = new Date().toISOString();
  const query = db.prepare(`
    SELECT s.id as session_id, s.token, s.expires_at, u.id, u.username, u.full_name, u.email, u.role, u.circle_id, u.ward_id, u.is_active
    FROM sessions s
    JOIN admin_users u ON s.admin_user_id = u.id
    WHERE s.token = ? AND s.expires_at > ? AND u.is_active = 1
  `);
  const row = query.get(token, now);
  return row || null;
}

function deleteSession(token) {
  if (!token) return;
  db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
}

function cleanExpiredSessions() {
  const now = new Date().toISOString();
  db.prepare('DELETE FROM sessions WHERE expires_at <= ?').run(now);
}

function logAudit(adminUserId, adminUsername, action, entityType, entityId, details, ipAddress) {
  try {
    const insert = db.prepare(`
      INSERT INTO audit_logs (admin_user_id, admin_username, action, entity_type, entity_id, details_json, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    insert.run(
      adminUserId || null,
      adminUsername || 'SYSTEM',
      action,
      entityType,
      String(entityId || ''),
      details ? JSON.stringify(details) : null,
      ipAddress || '127.0.0.1'
    );
  } catch (err) {
    console.error('Audit log error:', err.message);
  }
}

module.exports = {
  hashPassword,
  verifyPassword,
  createSession,
  validateSession,
  deleteSession,
  cleanExpiredSessions,
  logAudit,
  MAX_FAILED_ATTEMPTS,
  LOCKOUT_MINUTES
};
