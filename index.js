import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import fileUpload from 'express-fileupload';
import { errorHandler } from './src/middlewares/errors.middleware.js';
import { PORT, ALLOWED_CORS, pool } from './src/configs/config.js';
import { validateToken } from './src/utils/token.js';
import { router as apiRouter } from './src/routes/index.routes.js';
import { router as authRouter } from './src/routes/auth.routes.js';
import { RateLimitPostgresStore } from './src/stores/rateLimit.store.js';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import { NotFoundError } from './src/errors/errors.js';
import { insertAuditEvent } from './src/services/audit.service.js';

const swaggerDocument = YAML.load('./docs/swagger.yaml');
const app = express();

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
const corsOrigins = ALLOWED_CORS
  ? ALLOWED_CORS.split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  : ['http://localhost:5173', 'http://localhost:8080', 'http://localhost:8081'];
app.use(cors({ origin: corsOrigins }));
app.use(
  fileUpload({
    useTempFiles: false,
    limits: { fileSize: 50 * 1024 * 1024 }, //* límite de 50MB (ajustable)
    abortOnLimit: true,
    parseNested: true,
  }),
);
app.use(express.json());
app.disable('x-powered-by');
app.use(helmet());

const WINDOW_MS = 15 * 60 * 1000;
const authLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RateLimitPostgresStore({ windowMs: WINDOW_MS }),
  validate: { keyGeneratorIpFallback: false },
  keyGenerator: (req) =>
    `ip:${req.ip ?? req.socket?.remoteAddress ?? 'unknown'}`,
});
app.use('/auth', authLimiter, authRouter);

app.get('/health', (req, res) => {
  res.status(200).json({ ok: true });
});

app.use(validateToken);
app.use((req, res, next) => {
  const path = req.path || req.originalUrl || '';
  const method = req.method;

  if (
    path.startsWith('/health') ||
    path.startsWith('/api-docs') ||
    path.startsWith('/auth')
  ) {
    return next();
  }

  const user = res.user || {};
  const ip =
    req.ip ?? req.socket?.remoteAddress ?? null;
  const userAgent = req.headers['user-agent'] || null;

  const action =
    method === 'GET'
      ? 'READ'
      : method === 'POST'
      ? 'CREATE'
      : method === 'PUT' || method === 'PATCH'
      ? 'UPDATE'
      : method === 'DELETE'
      ? 'DELETE'
      : null;

  const metadata = {
    query_keys: Object.keys(req.query || {}),
    body_keys:
      req.body && typeof req.body === 'object'
        ? Object.keys(req.body)
        : [],
  };

  void insertAuditEvent({
    user_id: user.id_usuario ?? null,
    user_email: user.email ?? 'anonymous',
    user_role: user.id_tipo_usuario ?? null,
    ip_address: ip,
    user_agent: userAgent,
    service: 'tf_back',
    http_method: method,
    path,
    status_code: null,
    resource_type: null,
    patient_hash_id:
      req.hash_id ||
      req.dni_paciente ||
      null,
    action,
    request_id: null,
    metadata,
  });

  next();
});
app.use('/api', apiRouter);
app.use((req, res, next) => {
  next(new NotFoundError('Ruta no encontrada'));
});

app.use(errorHandler);

const port = Number(PORT) || 3000;
app.listen(port, () => {
  pool
    .query('SELECT 1')
    .then(() => {})
    .catch((err) => console.error('[BD] Error conectando:', err.message));
});
