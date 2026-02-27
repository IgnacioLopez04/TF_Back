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
[TF_Back - Node.js/Render]
      │  JWT interno
      ├──────────────────────▶ [fhir_server - Spring Boot/Render]
      │                                   │
      │                              [HAPI FHIR R5]
      │
      ├──▶ [PostgreSQL - Render Managed DB]
      └──▶ [AWS S3 - archivos médicos]
```

### Tabla STRIDE

| Categoría | Amenaza identificada | Superficie expuesta | Mitigación implementada | Estado |
|---|---|---|---|---|
| **S**poofing (Suplantación) | Un atacante intenta autenticarse como otro usuario | Endpoint `POST /auth/login` | Google OAuth 2.0 con verificación de `idToken` via `google-auth-library`; en dev: lookup por email en DB | ✅ Implementado |
| **S**poofing | Reutilización de token robado | Todas las rutas `/api` y `/fhir` | JWT firmado con HMAC-SHA-256 + expiración de 1 h (backend) y 8 h (FHIR) | ✅ Implementado |
| **T**ampering (Manipulación) | Modificación del payload del JWT para escalar privilegios | Header `Authorization` | Firma HMAC-SHA-256: cualquier alteración invalida la firma → rechazo 401/403 | ✅ Implementado |
| **T**ampering | Modificación de recursos FHIR en tránsito | Endpoints `PUT/POST /fhir/*` | HTTPS obligatorio en producción (Render + Vercel proveen TLS 1.2+) | ✅ Delegado a infraestructura |
| **R**epudiation (Repudio) | Un médico niega haber accedido o modificado un registro | Todas las operaciones con datos clínicos | Logs operacionales básicos en FHIR server (SLF4J); **no existe audit trail formal** | ⚠️ Gap — ver sección 5 |
| **I**nformation Disclosure | Exposición de datos clínicos sin autenticación | Rutas FHIR y API | Middleware `validateToken` en todas las rutas `/api`; `FhirAuthInterceptor` en todas las rutas `/fhir/*` excepto `/fhir/metadata` | ✅ Implementado |
| **I**nformation Disclosure | Acceso a archivos médicos mediante URL directa | AWS S3 | Pre-signed URLs con expiración de **10 minutos**; sin URL directa permanente | ✅ Implementado |
| **I**nformation Disclosure | Filtrado de tecnología usada (`X-Powered-By`) | Headers HTTP | `app.disable('x-powered-by')` en Express | ✅ Implementado |
| **I**nformation Disclosure | CORS permisivo permite requests desde orígenes no autorizados | Todos los endpoints | CORS configurado con lista blanca de orígenes en los tres componentes | ✅ Implementado |
| **D**enial of Service | Fuerza bruta sobre endpoint de autenticación | `POST /auth/login` | **Sin rate limiting implementado** | ⚠️ Gap — trabajo futuro |
| **D**enial of Service | Uploads masivos para saturar almacenamiento | `POST /api/file` | Límite de **50 MB por archivo** en `express-fileupload` y Spring multipart | ✅ Implementado |
| **E**levation of Privilege | Un usuario de bajo privilegio accede a datos de otro perfil | Rutas de negocio en `/api` | Rol `id_tipo_usuario` incluido en JWT; **no se verifica en controllers** | ⚠️ Gap — ver sección 5 |

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
const token = jwt.sign(
  { id_usuario, email, id_tipo_usuario },
  SECRET_KEY,          // desde variable de entorno SECRET_KEY
  { expiresIn: '1h' }
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
| Expiración | 1 hora | 8 horas |
| Claims incluidos | `id_usuario`, `email`, `id_tipo_usuario` | — (valida email) |
| Secret fuente | `process.env.SECRET_KEY` | `${JWT_SECRET}` (env var, sin fallback en prod) |

**Decisión de diseño — sin refresh tokens:** El sistema no implementa refresh tokens. Cuando el JWT expira, el usuario debe re-autenticarse. Esta decisión simplifica la arquitectura (elimina la necesidad de revocar refresh tokens) a costa de sesiones más cortas. El frontend maneja la expiración automáticamente con un polling cada 30 segundos y redirección automática al login.

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
| Usuario → TF_Back | Render (HTTPS automático) | Sí | TLS 1.2 |
| Usuario → fhir_server | Render (HTTPS automático) | Sí | TLS 1.2 |
| TF_Back → PostgreSQL | Render Managed DB | SSL habilitado | — |
| TF_Back → AWS S3 | AWS SDK (HTTPS) | Sí | TLS 1.2 |

**Observación sobre SSL de base de datos:** la conexión a PostgreSQL cuando se usa `DATABASE_URL` tiene `rejectUnauthorized: false`:

```javascript
// TF_Back/src/configs/config.js — línea 12
ssl: { rejectUnauthorized: false }
```

Esto permite certificados auto-firmados del servidor de base de datos. En Render Managed DB, los certificados son válidos pero la validación está deshabilitada. **Esta configuración es aceptable en un entorno académico/MVP** pero en producción formal debería activarse la verificación del certificado o usar el CA bundle provisto por el proveedor.

### 2.4 Cifrado en reposo

| Almacenamiento | Mecanismo | Responsable |
|---|---|---|
| Archivos médicos (S3) | SSE-S3 (AES-256, activado por defecto en todos los buckets desde enero 2023) | AWS |
| Base de datos PostgreSQL | Encryption at rest según política del proveedor (Render Managed DB) | Render |

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
| JWT signing key | fhir_server | `JWT_SECRET` | El `application.properties` tiene un **fallback hardcodeado** en desarrollo: `df8a3e5d9b2e4c97b1c6a574c0f7ac31a78e497f04d64a2b9c47e9db9a3c49e6`. En producción (`application-prod.properties`) el fallback **no existe** y la app falla si la variable no está definida. |
| Google OAuth | TF_Back | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | — |
| AWS credentials | TF_Back | `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` | — |
| DB password | TF_Back | `DB_PASSWORD` / `DATABASE_URL` | — |

**Limitación:** no se usa un sistema de gestión de secretos centralizado (KMS, HashiCorp Vault, AWS Secrets Manager). Los secretos se configuran directamente en el panel de variables de entorno del proveedor de hosting (Render). Para un sistema en producción con datos reales, se debería implementar rotación de secretos y auditoría de acceso a los mismos.

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

### 3.2 Logs operacionales existentes

El `fhir_server` registra todas las operaciones sobre recursos FHIR a nivel `INFO` en producción. Ejemplo de salida esperada:

```
INFO  PatientResourceProvider - Buscando paciente con hashId: a3f9c2...
INFO  ReportResourceProvider  - Creando reporte para paciente: a3f9c2...
WARN  PatientResourceProvider - Paciente no encontrado para hashId: b8d1e4...
```

Estos logs son operacionales, no constituyen un audit trail formal (ver sección 5).

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
| Confidencialidad de datos en tránsito | TLS 1.2+ en todos los tramos (Vercel + Render) | ✅ |
| Identificadores no expuestos | `hash_id` derivado del DNI (SHA-256 + salt) | ✅ |
| Integridad de datos | Firma JWT evita manipulación; S3 con SSE garantiza integridad en reposo | ✅ |
| Registro de accesos (auditoría) | **No implementado formalmente** | ⚠️ Gap |
| Derecho de acceso del paciente a sus datos | No aplicable (sistema interno para profesionales, no para pacientes) | — |
| Derecho al olvido / eliminación | No implementado | ⚠️ Gap / fuera de scope MVP |

### Declaración de alcance

Este sistema es un **prototipo académico (MVP)**. No está en producción con pacientes reales. Para su eventual despliegue en un entorno productivo real, se requeriría:
- Registro ante la **DNPDP** (Dirección Nacional de Protección de Datos Personales)
- Análisis de Impacto de Privacidad (DPIA) para tratamiento de datos sensibles de salud
- Implementación de audit trail completo
- Contrato de encargado de tratamiento con proveedores cloud (AWS, Render)

---

## 5. Gaps Identificados y Trabajo Futuro

Los siguientes gaps son reconocidos honestamente. No invalidan el sistema como prototipo, pero serían obligatorios en un sistema en producción con datos reales.

### Gap 1 — Audit Trail (alta prioridad para datos clínicos)

**Problema:** No existe registro estructurado de quién accedió a qué dato y cuándo. Los logs actuales son operacionales (debug/info) sin estructura de auditoría.

**Solución propuesta:** Agregar un middleware de auditoría en TF_Back:

```javascript
// Middleware propuesto para TF_Back/index.js
app.use((req, res, next) => {
  const user = res.user; // disponible tras validateToken
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    user_email: user?.email ?? 'anonymous',
    user_id: user?.id_usuario ?? null,
    method: req.method,
    path: req.path,
    ip: req.ip,
  }));
  next();
});
```

Y un `HandlerInterceptor` equivalente en el FHIR server.

### Gap 2 — RBAC no aplicado en controllers

**Problema:** El JWT incluye `id_tipo_usuario` (rol del usuario) y la tabla `tipo_usuario` existe en la base de datos, pero ningún controller verifica el rol antes de ejecutar operaciones. Un médico podría acceder a endpoints administrativos si conoce la URL.

**Estado declarado en README del backend:** "Control de acceso basado en roles (en desarrollo)".

**Solución propuesta:** Middleware de autorización por rol:

```javascript
// Ejemplo de uso propuesto
export const requireRole = (allowedRoles) => (req, res, next) => {
  if (!allowedRoles.includes(res.user.id_tipo_usuario)) {
    return res.status(403).json({ error: 'Acceso no autorizado para este rol' });
  }
  next();
};

// En routes
router.get('/admin/usuarios', requireRole([1]), UserController.getAll);
```

### Gap 3 — Sin rate limiting en autenticación

**Problema:** El endpoint `POST /auth/login` no tiene límite de intentos. Es susceptible a ataques de enumeración de cuentas o fuerza bruta en modo desarrollo.

**Solución propuesta:** `express-rate-limit` en el router de auth:

```javascript
import rateLimit from 'express-rate-limit';
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 });
app.use('/auth', authLimiter, authRouter);
```

### Gap 4 — Security headers HTTP ausentes

**Problema:** No se envían headers de seguridad estándar (`X-Frame-Options`, `X-Content-Type-Options`, `Strict-Transport-Security`, `Content-Security-Policy`).

**Solución propuesta:** Agregar `helmet` en TF_Back:

```javascript
import helmet from 'helmet';
app.use(helmet());
```

### Gap 5 — JWT secret con fallback hardcodeado en desarrollo

**Problema:** `application.properties` del FHIR server define un valor por defecto para `JWT_SECRET`:

```properties
jwt.secret=${JWT_SECRET:df8a3e5d9b2e4c97b1c6a574c0f7ac31a78e497f04d64a2b9c47e9db9a3c49e6}
```

Este valor es conocido (está en el repositorio). Si se despliega accidentalmente con el perfil de desarrollo, cualquier persona que conozca el secret podría generar tokens válidos.

**Mitigación actual:** el perfil de producción (`application-prod.properties`) no tiene fallback y falla en startup si la variable no está definida:

```properties
# application-prod.properties — línea 30
jwt.secret=${JWT_SECRET}
```

**Recomendación adicional:** eliminar el fallback también del perfil de desarrollo para evitar deployments descuidados.

### Gap 6 — Sin refresh tokens

**Problema:** Los JWT expiran a la 1 hora (backend) / 8 horas (FHIR). No hay mecanismo de renovación silenciosa.

**Impacto:** Los usuarios pierden la sesión y deben re-autenticarse. En una sesión médica activa de más de 1 hora, el usuario podría perder trabajo no guardado.

**Decisión de diseño:** se aceptó este tradeoff conscientemente para mantener la arquitectura simple. El frontend monitorea el token cada 30 segundos y notifica al usuario antes de la expiración. En producción real se implementaría un endpoint `POST /auth/refresh` con refresh tokens de larga duración almacenados en base de datos con revocación.

---

## 6. Resumen de Postura de Seguridad

| Control | Estado | Evidencia |
|---|---|---|
| Autenticación (OAuth 2.0 + JWT) | ✅ Implementado | Sección 2.1, 2.2 |
| Autorización (token requerido en todas las rutas protegidas) | ✅ Implementado | `validateToken` middleware, `FhirAuthInterceptor` |
| Cifrado en tránsito (TLS 1.2+) | ✅ Delegado a infraestructura | Sección 2.3 |
| Cifrado en reposo (S3 AES-256) | ✅ Por defecto en AWS | Sección 2.4 |
| Gestión de secretos (env vars, sin hardcode en prod) | ✅ Con observación en dev | Sección 2.5 |
| CORS restrictivo por lista blanca | ✅ Implementado | Sección 2.6 |
| Identificadores anonimizados (hash_id) | ✅ Implementado | Sección 2.7 |
| Pre-signed URLs temporales para archivos | ✅ Implementado (10 min) | Sección 2.4 |
| Expiración de tokens y cuentas | ✅ Implementado | Sección 2.2 |
| RBAC aplicado en controllers | ⚠️ Pendiente | Gap 2 |
| Audit trail estructurado | ⚠️ Pendiente | Gap 1 |
| Rate limiting en auth | ⚠️ Pendiente | Gap 3 |
| Security headers (helmet) | ⚠️ Pendiente | Gap 4 |
| Refresh tokens | ⚠️ Decisión consciente de no implementar | Gap 6 |
