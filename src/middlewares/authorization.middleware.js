/**
 * Middleware de autorización por rol (RBAC).
 * Debe usarse después de validateToken para que res.user exista.
 */
export const requireRole = (allowedRoles) => (req, res, next) => {
  if (!res.user) {
    return res.status(401).json({ error: 'No autenticado' });
  }
  if (!allowedRoles.includes(res.user.id_tipo_usuario)) {
    return res
      .status(403)
      .json({ error: 'Acceso no autorizado para este rol' });
  }
  next();
};
