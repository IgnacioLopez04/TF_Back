import { Router } from 'express';
import { insertAuditEvent } from '../services/audit.service.js';

const router = Router();
const INTERNAL_AUDIT_SECRET = process.env.INTERNAL_AUDIT_SECRET;

/**
 * POST /api/internal/audit
 * Recibe eventos de auditoría desde el fhir_server (u otros servicios internos).
 * Protegido por header X-Internal-Api-Key. No requiere JWT.
 */
router.post('/audit', (req, res) => {
  if (!INTERNAL_AUDIT_SECRET || INTERNAL_AUDIT_SECRET.length === 0) {
    return res.status(503).json({ error: 'Internal audit not configured' });
  }

  const apiKey = req.headers['x-internal-api-key'];
  if (apiKey !== INTERNAL_AUDIT_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const body = req.body;
  if (!body || typeof body !== 'object') {
    return res.status(400).json({ error: 'Body must be a JSON object' });
  }

  const user_email = body.user_email ?? 'anonymous';
  const service = body.service ?? 'fhir_server';
  const path = body.path;
  if (path == null || typeof path !== 'string') {
    return res.status(400).json({ error: 'path is required' });
  }

  const event = {
    user_id: body.user_id ?? null,
    user_email,
    user_role: body.user_role ?? null,
    ip_address: body.ip_address ?? null,
    user_agent: body.user_agent ?? null,
    service,
    http_method: body.http_method ?? null,
    path,
    status_code: body.status_code ?? null,
    resource_type: body.resource_type ?? null,
    patient_hash_id: body.patient_hash_id ?? null,
    action: body.action ?? null,
    metadata: body.metadata ?? null,
  };
  console.log(event);

  void insertAuditEvent(event);
  return res.status(204).send();
});

export { router };
