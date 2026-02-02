import pool from '../db.js';

export async function logAudit(userId, action, entityType, entityId, metadata = {}) {
  await pool.query(
    `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, metadata_json) VALUES ($1, $2, $3, $4, $5)`,
    [userId, action, entityType, entityId ? String(entityId) : null, JSON.stringify(metadata)]
  );
}
