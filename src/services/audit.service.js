import { pool } from '../configs/config.js';

/**
 * Inserta un evento de auditoría en la tabla audit_log.
 * Cualquier error se loguea pero no interrumpe el flujo de la request.
 *
 * Se asume una tabla con columnas al menos:
 * (user_id, user_email, user_role, ip_address, user_agent,
 *  service, http_method, path, status_code,
 *  resource_type, patient_hash_id, action, metadata).
 */
export const insertAuditEvent = async (event) => {
  const {
    user_id,
    user_email,
    user_role,
    ip_address,
    user_agent,
    service,
    http_method,
    path,
    status_code,
    resource_type,
    patient_hash_id,
    action,
    metadata,
  } = event;

  const text = `
    INSERT INTO audit_log (
      user_id,
      user_email,
      user_role,
      ip_address,
      user_agent,
      service,
      http_method,
      path,
      status_code,
      resource_type,
      patient_hash_id,
      action,
      metadata
    )
    VALUES (
      $1, $2, $3, $4, $5,
      $6, $7, $8, $9, $10,
      $11, $12, $13::jsonb
    )
  `;

  const values = [
    user_id ?? null,
    user_email ?? null,
    user_role ?? null,
    ip_address ?? null,
    user_agent ?? null,
    service ?? 'tf_back',
    http_method ?? null,
    path ?? null,
    status_code ?? null,
    resource_type ?? null,
    patient_hash_id ?? null,
    action ?? null,
    metadata ? JSON.stringify(metadata) : null,
  ];

  try {
    await pool.query(text, values);
  } catch (err) {
    console.error('[AUDIT] Error insertando en audit_log:', err.message);
  }
};

