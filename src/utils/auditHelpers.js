/**
 * Helpers para enriquecer eventos de auditoría (resource_type, patient_hash_id).
 */

const PATH_TO_RESOURCE_TYPE = {
  patient: 'Patient',
  user: 'User',
  ehr: 'EHR',
  file: 'File',
  report: 'Report',
  abm: 'Reference',
};

/**
 * Deriva resource_type del path de la request (primer segmento bajo /api/ o primer segmento si no hay /api/).
 * @param {string} path - req.path o req.originalUrl (sin query)
 * @returns {string | null}
 */
export function getResourceTypeFromPath(path) {
  if (!path || typeof path !== 'string') return null;
  const withoutQuery = path.split('?')[0];
  const segments = withoutQuery.split('/').filter(Boolean);
  const apiIndex = segments.indexOf('api');
  const firstSegment =
    apiIndex !== -1 && apiIndex < segments.length - 1
      ? segments[apiIndex + 1]
      : segments[0];
  return firstSegment ? (PATH_TO_RESOURCE_TYPE[firstSegment] ?? null) : null;
}

/**
 * Obtiene el patient_hash_id de params, query o body de la request.
 * @param {import('express').Request} req
 * @returns {string | null}
 */
export function getPatientHashIdFromRequest(req) {
  const fromParams = req.params && req.params.hash_id;
  const fromQuery = req.query && req.query.hash_id;
  const fromBody = req.body && typeof req.body === 'object' && req.body.hash_id;
  return fromParams || fromQuery || fromBody || null;
}
