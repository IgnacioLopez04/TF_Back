# Seguridad y Cumplimiento

> **Alcance:** Este documento cubre los tres componentes del sistema: `TF_Front` (Vue.js), `TF_Back` (Node.js/Express) y `fhir_server` (Java/Spring Boot + HAPI FHIR).  
> **Clasificación de datos:** el sistema procesa información clínica y datos personales de salud, categoría de **alto riesgo** según la normativa de protección de datos personales.

---

## 1. Modelo de Amenazas (STRIDE)

Se aplica el modelo STRIDE sobre los flujos principales del sistema: autenticación, acceso a datos clínicos (FHIR) y almacenamiento de archivos médicos (S3).

### Diagrama de flujo de datos (simplificado)

```
[Usuario/Médico]
      │  HTTPS
      ▼
[TF_Front - Vercel]
      │  HTTPS + JWT
      ▼
[TF_Back - Node.js/Railway]
      │  JWT interno (comunicación interna Railway)
      ├──────────────────────▶ [fhir_server - Spring Boot/Railway]
      │                                   │
      │                              [HAPI FHIR R5]
      │
      ├──▶ [PostgreSQL - Railway]
      └──▶ [AWS S3 - archivos médicos]
```

TF_Back, fhir_server y la base de datos PostgreSQL están alojados en **Railway**; la comunicación entre ellos es interna a la plataforma.

### Tabla STRIDE

| Categoría | Amenaza identificada | Superficie expuesta | Mitigación implementada | Estado |
|---|---|---|---|---|
| **S**poofing (Suplantación) | Un atacante intenta autenticarse como otro usuario | Endpoint `POST /auth/login` | Google OAuth 2.0 con verificación de `idToken` via `google-auth-library`; en dev: lookup por email en DB | ✅ Implementado |
| **S**poofing | Reutilización de token robado | Todas las rutas `/api` y `/fhir` | JWT firmado con HMAC-SHA-256 + expiración de 1 h (backend) y 8 h (FHIR) | ✅ Implementado |
| **T**ampering (Manipulación) | Modificación del payload del JWT para escalar privilegios | Header `Authorization` | Firma HMAC-SHA-256: cualquier alteración invalida la firma → rechazo 401/403 | ✅ Implementado |
| **T**ampering | Modificación de recursos FHIR en tránsito | Endpoints `PUT/POST /fhir/*` | HTTPS obligatorio en producción (Railway + Vercel proveen TLS 1.2+) | ✅ Delegado a infraestructura |
| **R**epudiation (Repudio) | Un médico niega haber accedido o modificado un registro | Todas las operaciones con datos clínicos | TF_Back: eventos en tabla `audit_log` (middleware de auditoría). fhir_server: `FhirAuditFilter` + `AuditLogService` registran cada petición a `/fhir/*`, envían eventos a TF_Back vía `POST /api/internal/audit` (header `X-Internal-Api-Key`); TF_Back persiste en la misma tabla `audit_log`. Trail unificado | ✅ Implementado |
| **I**nformation Disclosure | Exposición de datos clínicos sin autenticación | Rutas FHIR y API | Middleware `validateToken` en todas las rutas `/api`; `FhirAuthInterceptor` en todas las rutas `/fhir/*` excepto `/fhir/metadata` | ✅ Implementado |
| **I**nformation Disclosure | Acceso a archivos médicos mediante URL directa | AWS S3 | Pre-signed URLs con expiración de **10 minutos**; sin URL directa permanente | ✅ Implementado |
| **I**nformation Disclosure | Filtrado de tecnología usada (`X-Powered-By`) | Headers HTTP | `app.disable('x-powered-by')` en Express | ✅ Implementado |
| **I**nformation Disclosure | CORS permisivo permite requests desde orígenes no autorizados | Todos los endpoints | CORS configurado con lista blanca de orígenes en los tres componentes | ✅ Implementado |
| **D**enial of Service | Fuerza bruta sobre endpoint de autenticación | `POST /auth/login` | Rate limiting en `/auth` con `express-rate-limit` (10 req/15 min por IP, store en Postgres) | ✅ Implementado (actualización posterior) |
| **D**enial of Service | Uploads masivos para saturar almacenamiento | `POST /api/file` | Límite de **50 MB por archivo** en `express-fileupload` y Spring multipart | ✅ Implementado |
| **E**levation of Privilege | Un usuario de bajo privilegio accede a datos de otro perfil | Rutas de negocio en `/api` | Middleware `requireRole` verifica `id_tipo_usuario` en rutas administrativas (user, patient activate/delete, abm cargar) | ✅ Implementado — ver sección 5 |

---

## 2. Decisiones de Seguridad

### 2.1 Autenticación

#### Google OAuth 2.0 (producción)

En producción, el frontend envía el `credential` (Google ID Token) al backend. El backend lo valida con `google-auth-library`:

```javascript
// TF_Back/src/utils/oauth.js
const client = new OAuth2Client(GOOGLE_CLIENT_SECRET);

export const verifyGoogleToken = async (idToken) => {
  const ticket = await client.verifyIdToken({
    idToken,
    audience: GOOGLE_CLIENT_ID,   // valida que el token fue emitido para esta app
  });
  return ticket.getPayload();
};
```

Solo los emails pre-registrados en la base de datos pueden acceder (`AuthModel.login(googleUser.email)`). Un usuario con cuenta Google válida pero no registrado recibe `403 Forbidden`.

#### Acceso por email (desarrollo/testing)

En `NODE_ENV !== 'production'`, el login acepta el email directamente sin validación OAuth. Este modo **no debe usarse en producción**.

### 2.2 Tokens JWT

#### Generación (TF_Back)

```javascript
// TF_Back/src/utils/token.js
const { ACCESS_TOKEN_EXPIRATION = '1h' } = process.env;

const token = jwt.sign(
  { id_usuario, email, id_tipo_usuario },
  SECRET_KEY,          // desde variable de entorno SECRET_KEY
  { expiresIn: ACCESS_TOKEN_EXPIRATION }
);
```

#### Validación en FHIR Server (Spring Boot)

```java
// fhir_server/.../JwtAuthenticationFilter.java
SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
Claims claims = Jwts.parser()
    .verifyWith(key)
    .build()
    .parseSignedClaims(token)
    .getPayload();
```

| Parámetro | TF_Back | fhir_server |
|---|---|---|
| Algoritmo | HMAC-SHA-256 | HMAC-SHA-256 |
| Expiración access token | Configurable vía `ACCESS_TOKEN_EXPIRATION` (por defecto `1h` en prod, valores menores en dev para pruebas) | 8 horas (`JWT_EXPIRATION`) |
| Claims incluidos | `id_usuario`, `email`, `id_tipo_usuario` | — (valida email) |
| Secret fuente | `process.env.SECRET_KEY` | `${JWT_SECRET}` (env var, sin fallback en archivos de propiedades) |

**Refresh tokens:** Además del access token de corta duración, el backend emite un `refresh_token` opaco almacenado en la tabla `refresh_token` de PostgreSQL. Este token:
- Se devuelve al frontend únicamente como cookie `HttpOnly` (y `Secure` en producción), de nombre `refresh_token`.
- Tiene una expiración más larga que el access token (actualmente 1 día en base de datos, configurable) y puede revocarse explícitamente (logout) o por expiración.
- Se usa a través del endpoint `POST /auth/refresh` expuesto por `fhir_server`, que a su vez llama a `TF_Back /auth/refresh` para emitir un nuevo access token (y rotar el refresh token).

En frontend, un watcher verifica periódicamente la expiración del access token y llama a `/auth/refresh` **antes** de que expire, evitando forzar al usuario a re-autenticarse en sesiones largas.

#### Expiración de cuentas de usuario

Además de la expiración del JWT, las cuentas tienen expiración por inactividad:

```sql
-- Se actualiza en cada login exitoso
UPDATE usuario SET expired_at = NOW() + INTERVAL '180 days' WHERE hash_id = $1

-- Usuarios recién activados tienen 7 días para su primer login
UPDATE usuario SET expired_at = NOW() + INTERVAL '7 day' WHERE hash_id = $1
```

### 2.3 Cifrado en tránsito (TLS)

El cifrado en tránsito se delega a la capa de infraestructura:

| Tramo | Proveedor | TLS | Versión mínima |
|---|---|---|---|
| Usuario → Frontend | Vercel Edge Network | Sí | TLS 1.2 |
| Usuario → TF_Back | Railway (HTTPS automático) | Sí | TLS 1.2 |
| Usuario → fhir_server | Railway (HTTPS automático) | Sí | TLS 1.2 |
| TF_Back → fhir_server | Railway (comunicación interna) | Sí | TLS 1.2 |
| TF_Back → PostgreSQL | Railway (comunicación interna) | SSL habilitado | — |
| TF_Back → AWS S3 | AWS SDK (HTTPS) | Sí | TLS 1.2 |

**Observación sobre SSL de base de datos:** la conexión a PostgreSQL cuando se usa `DATABASE_URL` tiene `rejectUnauthorized: false`:

```javascript
// TF_Back/src/configs/config.js — línea 12
ssl: { rejectUnauthorized: false }
```

Esto permite certificados auto-firmados del servidor de base de datos. En Railway, los certificados son válidos pero la validación está deshabilitada. **Esta configuración es aceptable en un entorno académico/MVP** pero en producción formal debería activarse la verificación del certificado o usar el CA bundle provisto por el proveedor.

### 2.4 Cifrado en reposo

| Almacenamiento | Mecanismo | Responsable |
|---|---|---|
| Archivos médicos (S3) | SSE-S3 (AES-256, activado por defecto en todos los buckets desde enero 2023) | AWS |
| Base de datos PostgreSQL | Encryption at rest según política del proveedor (Railway) | Railway |

Los archivos médicos nunca se exponen con URL directa permanente. Se generan pre-signed URLs temporales de 10 minutos:

```javascript
// TF_Back/src/controllers/file.controller.js — línea 112
const url = await getSignedUrl(s3, command, { expiresIn: 60 * 10 }); // 10 minutos
```

### 2.5 Gestión de Secretos

Todos los secretos se gestionan como variables de entorno. Ningún secret se commitea al repositorio (`.env` está en `.gitignore` en los tres proyectos).

| Secret | Componente | Variable de entorno | Riesgo identificado |
|---|---|---|---|
| JWT signing key | TF_Back | `SECRET_KEY` | — |
| JWT signing key | fhir_server | `JWT_SECRET` | Tanto `application.properties` como `application-prod.properties` exigen que `JWT_SECRET` se defina vía variable de entorno (sin fallback en los archivos de propiedades); si no está presente, el servidor no arranca. |
| Google OAuth | TF_Back | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | — |
| AWS credentials | TF_Back | `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` | — |
| DB password | TF_Back | `DB_PASSWORD` / `DATABASE_URL` | — |
| Clave auditoría interna | TF_Back | `INTERNAL_AUDIT_SECRET` | Protege `POST /api/internal/audit`; sin ella la ruta responde 503. |
| Clave auditoría interna | fhir_server | `TFBACK_AUDIT_SECRET` (mapeado a `tfback.audit.secret`) | Mismo valor que `INTERNAL_AUDIT_SECRET`; se envía en header `X-Internal-Api-Key` al enviar eventos a TF_Back. |

**Limitación:** no se usa un sistema de gestión de secretos centralizado (KMS, HashiCorp Vault, AWS Secrets Manager). Los secretos se configuran directamente en el panel de variables de entorno del proveedor de hosting (Railway). Para un sistema en producción con datos reales, se debería implementar rotación de secretos y auditoría de acceso a los mismos.

### 2.6 Control de Acceso (CORS)

Los tres componentes tienen CORS configurado con lista blanca de orígenes:

```javascript
// TF_Back/index.js
const corsOrigins = ALLOWED_CORS
  ? ALLOWED_CORS.split(',').map(s => s.trim()).filter(Boolean)
  : ['http://localhost:5173', 'http://localhost:8080', 'http://localhost:8081'];
app.use(cors({ origin: corsOrigins }));
```

```properties
# fhir_server/application-prod.properties
spring.web.cors.allowed-origins=${CORS_ALLOWED_ORIGINS:https://TU_FRONTEND.vercel.app}
```

### 2.7 Identificadores anonimizados

Los pacientes se identifican en el sistema mediante un `hash_id` derivado del DNI:

```javascript
// TF_Back/src/utils/encrypt.js
import crypto from 'crypto';
// SHA-256 con salt aleatorio para generar identificadores no reversibles desde el DNI
```

Esto evita que el DNI del paciente aparezca como parámetro en URLs o en logs de aplicación.

---

## 3. Evidencia de Controles Implementados

### 3.1 Pruebas a ejecutar para documentar

Las siguientes pruebas deben ejecutarse y capturarse (con herramienta como Postman, curl o Bruno) para incluir como evidencia en el trabajo:

#### Prueba 1 — Request sin token → 401

```bash
curl -X GET https://<BACKEND_URL>/api/paciente/12345678
# Respuesta esperada: 401 Authorization header is required
```

#### Prueba 2 — Request al FHIR server sin token → 401

```bash
curl -X GET https://<FHIR_URL>/fhir/Patient
# Respuesta esperada: 401 {"error": "Authorization header is required"}
```

#### Prueba 3 — Token manipulado → 403

```bash
# Tomar un JWT válido y modificar el último carácter
curl -X GET https://<BACKEND_URL>/api/paciente/12345678 \
  -H "Authorization: <TOKEN_VALIDO_CON_UN_CARACTER_MODIFICADO>"
# Respuesta esperada: 403 Token expired or invalid
```

#### Prueba 4 — Token válido → acceso concedido

```bash
curl -X GET https://<BACKEND_URL>/api/paciente/12345678 \
  -H "Authorization: <TOKEN_VALIDO>"
# Respuesta esperada: 200 con datos del paciente
```

#### Prueba 5 — Token expirado → 403

```bash
# Usar un JWT con exp en el pasado (modificar el campo en jwt.io con la clave conocida del ambiente de dev)
# Respuesta esperada: 403 Token expired or invalid
```

#### Prueba 6 — `/fhir/metadata` sin token → 200 (endpoint público)

```bash
curl -X GET https://<FHIR_URL>/fhir/metadata
# Respuesta esperada: 200 con el CapabilityStatement FHIR
```

#### Prueba 7 — Verificar payload del JWT

Decodificar en [jwt.io](https://jwt.io) un token generado para mostrar los claims:
```json
{
  "id_usuario": 5,
  "email": "medico@hospital.com",
  "id_tipo_usuario": 2,
  "iat": 1740000000,
  "exp": 1740003600
}
```

### 3.2 Logs operacionales y eventos de auditoría

El `fhir_server` registra todas las operaciones sobre recursos FHIR a nivel `INFO` en producción. Las peticiones a `/fhir/*` pasan por el **filtro** `FhirAuditFilter` (las rutas FHIR son atendidas por el servlet HAPI y no por los controladores MVC, por lo que el audit se hace en un Filter). El `AuditLogService` genera eventos estructurados (user_email, service, http_method, path, ip_address, resource_type, patient_hash_id, action, status_code), los escribe en log con el prefijo `FHIR_AUDIT_EVENT` y los envía de forma asíncrona a TF_Back (`POST /api/internal/audit`) con el header `X-Internal-Api-Key`. TF_Back persiste todos los eventos (propios y del fhir_server) en la tabla `audit_log`, unificando el audit trail.

Ejemplo de logs operacionales:

```
INFO  PatientResourceProvider - Buscando paciente con hashId: a3f9c2...
INFO  ReportResourceProvider  - Creando reporte para paciente: a3f9c2...
INFO  ... - FHIR_AUDIT_EVENT {user_email=medico@hospital.com, service=fhir_server, http_method=GET, path=/fhir/Patient/..., ...}
WARN  PatientResourceProvider - Paciente no encontrado para hashId: b8d1e4...
```

---

## 4. Marco Legal Aplicable

### Normativa argentina

| Norma | Aplicación al sistema |
|---|---|
| **Ley 25.326** — Protección de Datos Personales | Los datos de salud son **datos sensibles** (art. 2). Su tratamiento requiere consentimiento expreso del titular (art. 7). Solo pueden ser tratados por profesionales de la salud con obligación de secreto profesional. |
| **Ley 26.529** — Derechos del Paciente en la Historia Clínica | Regula el acceso, confidencialidad e integridad de la historia clínica electrónica. El paciente tiene derecho a acceder a su propia historia (art. 14). |
| **Disposición DNPDP 11/2006** | Medidas de seguridad para el tratamiento de datos personales en soporte informático. |

### Cómo el sistema aborda estos requisitos

| Requisito legal | Implementación actual | Estado |
|---|---|---|
| Acceso solo a personal autorizado | Google OAuth + JWT + lista blanca de usuarios en DB | ✅ |
| Confidencialidad de datos en tránsito | TLS 1.2+ en todos los tramos (Vercel + Railway) | ✅ |
| Identificadores no expuestos | `hash_id` derivado del DNI (SHA-256 + salt) | ✅ |
| Integridad de datos | Firma JWT evita manipulación; S3 con SSE garantiza integridad en reposo | ✅ |
| Registro de accesos (auditoría) | TF_Back: tabla `audit_log` (middleware tras `validateToken`). fhir_server: `FhirAuditFilter` + `AuditLogService` envían eventos a TF_Back (`POST /api/internal/audit`, clave interna); persistencia centralizada en `audit_log` | ✅ Implementado |
| Derecho de acceso del paciente a sus datos | No aplicable (sistema interno para profesionales, no para pacientes) | — |
| Derecho al olvido / eliminación | No implementado | ⚠️ Gap / fuera de scope MVP |

### Declaración de alcance

Este sistema es un **prototipo académico (MVP)**. No está en producción con pacientes reales. Para su eventual despliegue en un entorno productivo real, se requeriría:
- Registro ante la **DNPDP** (Dirección Nacional de Protección de Datos Personales)
- Análisis de Impacto de Privacidad (DPIA) para tratamiento de datos sensibles de salud
- Implementación de audit trail completo
- Contrato de encargado de tratamiento con proveedores cloud (AWS, Railway)

---

## 5. Gaps Identificados y Trabajo Futuro

Los siguientes gaps son reconocidos honestamente. No invalidan el sistema como prototipo, pero serían obligatorios en un sistema en producción con datos reales.

### Gap 1 — Audit Trail (alta prioridad para datos clínicos) — **MITIGADO**

**Problema (original):** No existía registro estructurado de quién accedió a qué dato y cuándo. Los logs eran puramente operacionales (debug/info) sin estructura de auditoría.

**Implementación en TF_Back:** Se agregó un middleware de auditoría en `index.js`, encadenado después de `validateToken` y antes de montar las rutas `/api`. Este middleware:

```javascript
app.use(validateToken);
app.use((req, res, next) => {
  const path = req.path || req.originalUrl || '';

  if (
    path.startsWith('/health') ||
    path.startsWith('/api-docs') ||
    path.startsWith('/auth')
  ) {
    return next();
  }

  const user = res.user || {};

  const method = req.method;
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
    metadata,
  });

  next();
});
```

De este modo se registra quién accede a rutas de negocio sin incluir el contenido completo de los cuerpos (solo las claves), reduciendo el riesgo de exponer datos clínicos en los logs.

**Ruta interna de auditoría:** TF_Back expone `POST /api/internal/audit` (en `src/routes/internal.routes.js`), montada **antes** de `validateToken` para no requerir JWT. La ruta exige el header `X-Internal-Api-Key` con el valor de `INTERNAL_AUDIT_SECRET`. El cuerpo del request incluye `user_email`, `service`, `http_method`, `path`, `ip_address`, `user_agent`, `status_code`, `resource_type`, `patient_hash_id`, `action`. Se llama a `insertAuditEvent(event)` y se persiste en la tabla `audit_log`. Esta ruta está pensada para que el fhir_server (u otros servicios internos) envíen sus eventos de auditoría y se unifique el trail en una sola tabla.

**Implementación en fhir_server:** Las peticiones a `/fhir/*` son atendidas por el servlet HAPI y no pasan por los interceptores de Spring MVC; por eso el audit se realiza en un **filtro**: `FhirAuditFilter` (configurado en `SecurityConfig`). El filtro ejecuta antes y después de la cadena de filtros; tras `doFilter` usa un `StatusCapturingResponseWrapper` para conocer el código HTTP de respuesta y luego llama a `AuditLogService.saveAuditEvent(userEmail, method, path, ipAddress, userAgent, resourceType, patientHashId, action, statusCode)`. La IP del cliente se obtiene de `X-Forwarded-For` / `X-Real-IP` o `getRemoteAddr()`, y las direcciones loopback se normalizan a `127.0.0.1`. El `AuditLogService` escribe el evento en log (`FHIR_AUDIT_EVENT`) y lo envía de forma asíncrona a TF_Back mediante `RestTemplate` a `{tfback.url}{tfback.api.path}/internal/audit`, con el header `X-Internal-Api-Key` tomado de `tfback.audit.secret` (misma clave que `INTERNAL_AUDIT_SECRET` en TF_Back). Si el secret no está configurado, solo se registra en log y no se envía.

En resumen:

- En **TF_Back** se registran en `audit_log` tanto los eventos de las rutas `/api` (middleware de auditoría) como los recibidos vía `POST /api/internal/audit` (fhir_server y otros servicios internos).
- En **fhir_server**, el `FhirAuditFilter` y el `AuditLogService` generan cada evento FHIR, lo registran en log y lo envían a TF_Back para su persistencia en la misma tabla `audit_log`. El audit trail de datos clínicos queda centralizado.

### Gap 2 — RBAC no aplicado en controllers — **MITIGADO**

**Problema (original):** El JWT incluye `id_tipo_usuario` (rol del usuario) y la tabla `tipo_usuario` existe en la base de datos, pero ningún controller verifica el rol antes de ejecutar operaciones. Un médico podría acceder a endpoints administrativos si conoce la URL.

**Implementación:** Se añadió el middleware `requireRole` en `TF_Back/src/middlewares/authorization.middleware.js`. Recibe una lista de roles permitidos y devuelve 403 con mensaje "Acceso no autorizado para este rol" si `res.user.id_tipo_usuario` no está en la lista. Las constantes de rol (p. ej. `ROLES.ADMIN = 1`) están en `src/constants/roles.js`.

**Rutas protegidas con `requireRole([ROLES.ADMIN])`:**
- **user.routes.js:** create, getUsers, getActiveUsers, getUserType, updateUser, getUser por DNI, blockUser, updateExpiredAt, activateUser.
- **patient.routes.js:** PUT /activate/:hash_id (reactivar paciente), DELETE /delete/:hash_id (eliminar paciente).
- **abm.routes.js:** POST /cargar-provincias, POST /cargar-ciudades.

El middleware se usa después de `validateToken` (global en `/api`), por lo que en rutas sensibles se encadena `requireRole([ROLES.ADMIN])` antes del controller.

### Gap 3 — Rate limiting en autenticación — **MITIGADO**

**Problema (original):** El endpoint `POST /auth/login` no tenía límite de intentos y era susceptible a ataques de enumeración de cuentas o fuerza bruta (especialmente en modo desarrollo).

**Implementación:** Se añadió `express-rate-limit` en `TF_Back/index.js` sobre el router de autenticación:

```javascript
import rateLimit from 'express-rate-limit';
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
```

### Gap 4 — Security headers HTTP ausentes — **MITIGADO**

**Problema (original):** No se enviaban headers de seguridad estándar (`X-Frame-Options`, `X-Content-Type-Options`, `Strict-Transport-Security`, `Content-Security-Policy`).

**Implementación:** Se incorporó `helmet` en `TF_Back/index.js`, junto con la desactivación de `X-Powered-By`:

```javascript
import helmet from 'helmet';
app.disable('x-powered-by');
app.use(helmet());
```

### Gap 5 — JWT secret con fallback hardcodeado en desarrollo — **MITIGADO**

**Problema (original):** versiones anteriores de `application.properties` del FHIR server definían un valor por defecto para `JWT_SECRET`:

```properties
jwt.secret=${JWT_SECRET:df8a3e5d9b2e4c97b1c6a574c0f7ac31a78e497f04d64a2b9c47e9db9a3c49e6}
```

Este valor era conocido (estaba en el repositorio). Si se desplegaba accidentalmente con el perfil de desarrollo, cualquier persona que conociera el secret podía generar tokens válidos.

**Estado actual (mitigación):** tanto `application.properties` como `application-prod.properties` requieren ahora que `JWT_SECRET` se defina explícitamente vía variable de entorno, sin fallback en los archivos de propiedades:

```properties
# application.properties / application-prod.properties
jwt.secret=${JWT_SECRET}
```

Un despliegue sin `JWT_SECRET` falla en startup, evitando el uso de secrets hardcodeados.

### Gap 6 — Refresh tokens — **MITIGADO**

**Problema (original):** inicialmente solo existían access tokens JWT de corta duración (1 hora en backend / 8 horas en FHIR) sin mecanismo de renovación silenciosa, por lo que el usuario perdía la sesión al expirar el token.

**Implementación actual:** se incorporó un flujo de refresh tokens opacos:

- `TF_Back` emite un `refresh_token` aleatorio, lo almacena en la tabla `refresh_token` (con `expires_at` y posibilidad de revocación) y lo rota en cada `/auth/refresh`.
- `fhir_server` expone `/auth/refresh`, que lee el `refresh_token` desde una cookie `HttpOnly` / `Secure` y delega en `TF_Back` la validación y emisión de un nuevo par `access_token` + `refresh_token`.
- En logout (`/auth/logout`) se revoca el refresh token en backend y se elimina la cookie.

Con esto, las sesiones pueden renovarse de forma transparente mientras el refresh token siga siendo válido.

---

## 6. Resumen de Postura de Seguridad

| Control | Estado | Evidencia |
|---|---|---|
| Autenticación (OAuth 2.0 + JWT) | ✅ Implementado | Sección 2.1, 2.2 |
| Autorización (token requerido en todas las rutas protegidas) | ✅ Implementado | `validateToken` middleware, `FhirAuthInterceptor` |
| Cifrado en tránsito (TLS 1.2+) | ✅ Delegado a infraestructura | Sección 2.3 |
| Cifrado en reposo (S3 AES-256) | ✅ Por defecto en AWS | Sección 2.4 |
| Gestión de secretos (env vars, sin hardcode en prod) | ✅ | Sección 2.5 |
| CORS restrictivo por lista blanca | ✅ Implementado | Sección 2.6 |
| Identificadores anonimizados (hash_id) | ✅ Implementado | Sección 2.7 |
| Pre-signed URLs temporales para archivos | ✅ Implementado (10 min) | Sección 2.4 |
| Expiración de tokens y cuentas | ✅ Implementado | Sección 2.2 |
| RBAC aplicado en controllers | ✅ Implementado | Middleware `requireRole`; rutas user, patient (activate/delete), abm (cargar-provincias/ciudades) — Gap 2 |
| Audit trail estructurado | ✅ Implementado | TF_Back: middleware de auditoría + tabla `audit_log`; ruta `POST /api/internal/audit` (X-Internal-Api-Key) para eventos internos. fhir_server: `FhirAuditFilter` + `AuditLogService` envían eventos a TF_Back; persistencia centralizada en `audit_log` (Gap 1 mitigado). |
| Rate limiting en auth | ✅ Implementado | Gap 3 — mitigado en `TF_Back/index.js` |
| Security headers (helmet) | ✅ Implementado | Gap 4 — mitigado en `TF_Back/index.js` |
| Refresh tokens | ✅ Implementado (access/refresh con rotación y cookie `HttpOnly`) | Sección 2.2 y Gap 6 |
