# Esquema de base de datos PostgreSQL

**Esquema:** `public`  
**Owner:** `postgres`  
**Total de tablas:** 24  

Documento generado con la estructura completa de tablas, columnas, tipos de datos, claves primarias (PK), claves foráneas (FK), índices y relaciones.

---

## Índice de tablas

| Tabla | Descripción breve |
|-------|-------------------|
| anexo | Anexos de informes |
| audit_log | Registro de auditoría de acciones |
| ciudad | Ciudades (geografía) |
| dato_mutual | Datos de afiliación a mutuales por paciente |
| documento | Documentos asociados a pacientes |
| especialidad | Especialidades médicas |
| estudio_medico | Estudios médicos por paciente |
| hc_fisiatrica | Historia clínica fisiatría (versionado) |
| historia_clinica | Historia clínica principal |
| informe | Informes médicos |
| informe_documento | Relación N:M informe-documento |
| modulo | Módulos del sistema |
| mutual | Mutuales / obras sociales |
| paciente | Pacientes |
| prestacion | Tipos de prestación |
| profesional | Profesionales de salud |
| profesional_especialidad | Relación N:M profesional-especialidad |
| provincia | Provincias |
| rate_limit | Control de tasa (rate limiting) |
| refresh_token | Tokens de refresco de sesión |
| tipo_informe | Tipos de informe |
| tipo_usuario | Roles/tipos de usuario |
| tutor | Tutores de pacientes |
| usuario | Usuarios del sistema |

---

## Diagrama de relaciones (resumen)

```
provincia ──< ciudad ──< paciente >── dato_mutual >── mutual
                │            │
                │            ├──< documento
                │            ├──< estudio_medico
                │            ├──< historia_clinica >── modulo
                │            │         │                  │
                │            │         └──< hc_fisiatrica  │
                │            │         └──< informe >── informe_documento
                │            └──< tutor                   │
                │                                          │
prestacion ──< paciente    documento <────────────────────┘
                │
tipo_usuario ──< usuario >── profesional >──< profesional_especialidad >── especialidad
     │               │              │
     │               ├──< documento │
     │               ├──< informe   └──< historia_clinica
     │               ├──< refresh_token
     │               └──< anexo (informe)
     │
     └── profesional (id_usuario)
```

---

## Detalle por tabla

### 1. anexo

Anexos asociados a informes (reportes adicionales).

| Columna | Tipo | ¿NULL? | Default |
|---------|------|--------|---------|
| id_anexo | integer | NO | nextval('anexo_id_anexo_seq') |
| id_informe | integer | SÍ | — |
| fecha_creacion | timestamp without time zone | SÍ | CURRENT_TIMESTAMP |
| reporte | text | NO | — |
| id_usuario | integer | SÍ | — |
| hash_id | character varying(64) | SÍ | — |

**Clave primaria (PK):** `anexo_pkey` → `(id_anexo)`

**Claves foráneas (FK):**
| Constraint | Columna(s) | Referencia |
|------------|------------|------------|
| anexo_id_informe_fkey | id_informe | informe(id_informe) |
| anexo_id_usaurio_fkey | id_usuario | usuario(id_usuario) NOT VALID |

**Índices:** `anexo_pkey` (UNIQUE, PK) sobre `(id_anexo)`.

---

### 2. audit_log

Registro de auditoría de accesos y acciones (usuario, IP, servicio, path, paciente, etc.).

| Columna | Tipo | ¿NULL? | Default |
|---------|------|--------|---------|
| id | bigint | NO | nextval('audit_log_id_seq') |
| created_at | timestamp with time zone | SÍ | now() |
| user_id | bigint | SÍ | — |
| user_email | text | SÍ | — |
| user_role | text | SÍ | — |
| ip_address | inet | SÍ | — |
| user_agent | text | SÍ | — |
| service | text | NO | — |
| http_method | text | NO | — |
| path | text | NO | — |
| status_code | integer | SÍ | — |
| resource_type | text | SÍ | — |
| patient_hash_id | text | SÍ | — |
| action | text | SÍ | — |
| request_id | uuid | SÍ | — |
| metadata | jsonb | SÍ | — |

**Clave primaria (PK):** `audit_log_pkey` → `(id)`

**Claves foráneas:** Ninguna.

**Índices:**
| Nombre | Único | Columnas |
|--------|-------|----------|
| audit_log_pkey | SÍ | (id) |
| idx_audit_log_user | NO | (user_id, created_at DESC) |
| idx_audit_log_patient | NO | (patient_hash_id, created_at DESC) |
| idx_audit_log_created_at | NO | (created_at DESC) |
| idx_audit_log_service_path | NO | (service, path) |

---

### 3. ciudad

Ciudades con código postal y provincia.

| Columna | Tipo | ¿NULL? | Default |
|---------|------|--------|---------|
| id_ciudad | bigint | NO | nextval('ciudad_id_ciudad_seq') |
| nombre | character varying(100) | NO | — |
| id_provincia | integer | SÍ | — |
| codigo_postal | integer | SÍ | — |

**Clave primaria (PK):** `ciudad_pkey` → `(id_ciudad)`

**Claves foráneas:**
| Constraint | Columna(s) | Referencia |
|------------|------------|------------|
| ciudad_id_provincia_fkey | id_provincia | provincia(id_provincia) |

**Índices:** `ciudad_pkey` (UNIQUE, PK) sobre `(id_ciudad)`.

---

### 4. dato_mutual

Afiliación de pacientes a mutuales (número de afiliado, vigencia).

| Columna | Tipo | ¿NULL? | Default |
|---------|------|--------|---------|
| id_datos_mutual | integer | NO | nextval('dato_mutual_id_datos_mutual_seq') |
| id_mutual | integer | SÍ | — |
| dni_paciente | bigint | SÍ | — |
| numero_afiliado | character varying(25) | SÍ | — |
| fecha_vigencia | date | SÍ | CURRENT_DATE |

**Clave primaria (PK):** `dato_mutual_pkey` → `(id_datos_mutual)`

**Claves foráneas:**
| Constraint | Columna(s) | Referencia |
|------------|------------|------------|
| dato_mutual_id_mutual_fkey | id_mutual | mutual(id_mutual) |
| dato_mutual_dni_paciente_fkey | dni_paciente | paciente(dni_paciente) |

**Índices:** `dato_mutual_pkey` (UNIQUE, PK) sobre `(id_datos_mutual)`.

---

### 5. documento

Documentos (archivos) asociados a pacientes; path, key S3, tipo, título, descripción.

| Columna | Tipo | ¿NULL? | Default |
|---------|------|--------|---------|
| id_documento | integer | NO | nextval('documento_id_documento_seq') |
| dni_paciente | bigint | NO | — |
| id_usuario | integer | NO | — |
| path | text | NO | — |
| key | character varying(150) | SÍ | — |
| fecha_creacion | timestamp without time zone | SÍ | CURRENT_TIMESTAMP |
| nombre | character varying(150) | NO | — |
| tipo_archivo | character varying(25) | SÍ | — |
| titulo | text | SÍ | — |
| descripcion | text | SÍ | — |

**Clave primaria (PK):** `documento_pkey` → `(id_documento)`

**Claves foráneas:**
| Constraint | Columna(s) | Referencia |
|------------|------------|------------|
| documento_dni_paciente_fkey | dni_paciente | paciente(dni_paciente) |
| documento_id_usuario_fkey | id_usuario | usuario(id_usuario) |

**Índices:** `documento_pkey` (UNIQUE, PK) sobre `(id_documento)`.

---

### 6. especialidad

Catálogo de especialidades médicas.

| Columna | Tipo | ¿NULL? | Default |
|---------|------|--------|---------|
| id_especialidad | integer | NO | nextval('especialidad_id_especialidad_seq') |
| descripcion | character varying(100) | NO | — |

**Clave primaria (PK):** `especialidad_pkey` → `(id_especialidad)`

**Claves foráneas:** Ninguna.

**Índices:** `especialidad_pkey` (UNIQUE, PK) sobre `(id_especialidad)`.

---

### 7. estudio_medico

Estudios médicos (imágenes/resultados) por paciente; path del archivo.

| Columna | Tipo | ¿NULL? | Default |
|---------|------|--------|---------|
| id_estudio | integer | NO | nextval('estudio_medico_id_estudio_seq') |
| dni_paciente | bigint | NO | — |
| nombre | character varying(100) | SÍ | — |
| descripcion | character varying(255) | SÍ | — |
| path | character varying(150) | NO | — |

**Clave primaria (PK):** `estudio_medico_pkey` → `(id_estudio)`

**Claves foráneas:**
| Constraint | Columna(s) | Referencia |
|------------|------------|------------|
| estudio_medico_dni_paciente_fkey | dni_paciente | paciente(dni_paciente) |

**Índices:** `estudio_medico_pkey` (UNIQUE, PK) sobre `(id_estudio)`.

---

### 8. hc_fisiatrica

Historia clínica de fisiatría con versionado (campos en JSONB).

| Columna | Tipo | ¿NULL? | Default |
|---------|------|--------|---------|
| id_hc_fisiatrica | integer | NO | nextval('hc_fisiatrica_id_hc_fisiatrica_seq') |
| id_historia_clinica | integer | NO | — |
| fecha_creacion | timestamp without time zone | SÍ | CURRENT_TIMESTAMP |
| fisiologico | jsonb | SÍ | — |
| anamnesis_sistemica | jsonb | SÍ | — |
| examen_fisico | jsonb | SÍ | — |
| antecedentes | jsonb | SÍ | — |
| evaluacion_consulta | jsonb | SÍ | — |
| diagnostico_funcional | jsonb | SÍ | — |
| version_number | integer | NO | 1 |
| effective_from | timestamp with time zone | NO | CURRENT_TIMESTAMP |
| effective_to | timestamp with time zone | SÍ | — |
| is_current | boolean | NO | true |

**Clave primaria (PK):** `pkey_hc_fisiatrica` → `(id_hc_fisiatrica, id_historia_clinica)`

**Restricción UNIQUE:** `uq_hc_fisiatrica_version` → `(id_historia_clinica, version_number)`

**Claves foráneas:**
| Constraint | Columna(s) | Referencia |
|------------|------------|------------|
| hc_fisiatrica_id_historia_clinica_fkey | id_historia_clinica | historia_clinica(id_historia_clinica) |

**Índices:**
| Nombre | Único | Columnas / Condición |
|--------|-------|----------------------|
| pkey_hc_fisiatrica | SÍ | (id_hc_fisiatrica, id_historia_clinica) |
| uq_hc_fisiatrica_version | SÍ | (id_historia_clinica, version_number) |
| idx_hc_fisiatrica_current | SÍ | (id_historia_clinica) WHERE (is_current = true) |

---

### 9. historia_clinica

Historia clínica principal por paciente (una por DNI); módulo y profesional.

| Columna | Tipo | ¿NULL? | Default |
|---------|------|--------|---------|
| id_historia_clinica | integer | NO | nextval('historia_clinica_id_historia_clinica_seq') |
| frecuencia | integer | SÍ | — |
| dni_paciente | bigint | NO | — |
| id_modulo | integer | SÍ | — |
| fecha_creacion | date | SÍ | CURRENT_DATE |
| id_profesional | integer | SÍ | — |
| hash_id | character varying(64) | SÍ | — |
| fecha_modificacion | timestamp without time zone | SÍ | — |

**Clave primaria (PK):** `historia_clinica_pkey` → `(id_historia_clinica)`

**Restricción UNIQUE:** `dni_unique` → `(dni_paciente)` (una HC por paciente).

**Claves foráneas:**
| Constraint | Columna(s) | Referencia |
|------------|------------|------------|
| historia_clinica_id_modulo_fkey | id_modulo | modulo(id_modulo) |
| historia_clinica_id_profesional_fkey | id_profesional | profesional(id_profesional) |
| historia_clinica_dni_paciente_fkey | dni_paciente | paciente(dni_paciente) |

**Índices:**
| Nombre | Único | Columnas |
|--------|-------|----------|
| historia_clinica_pkey | SÍ | (id_historia_clinica) |
| dni_unique | SÍ | (dni_paciente) |

---

### 10. informe

Informes médicos (reporte, título, tipo, especialidad, usuario, paciente, historia clínica).

| Columna | Tipo | ¿NULL? | Default |
|---------|------|--------|---------|
| id_informe | integer | NO | nextval('informe_id_informe_seq') |
| id_usuario | integer | NO | — |
| dni_paciente | bigint | NO | — |
| fecha_creacion | timestamp without time zone | SÍ | CURRENT_TIMESTAMP |
| reporte | text | NO | — |
| id_especialidad | integer | SÍ | — |
| titulo | text | SÍ | — |
| id_tipo_informe | integer | SÍ | — |
| id_historia_clinica | integer | SÍ | — |
| hash_id | character varying(64) | SÍ | — |

**Clave primaria (PK):** `informe_pkey` → `(id_informe)`

**Claves foráneas:**
| Constraint | Columna(s) | Referencia |
|------------|------------|------------|
| informe_dni_paciente_fkey | dni_paciente | paciente(dni_paciente) |
| informe_id_especialidad | id_especialidad | especialidad(id_especialidad) NOT VALID |
| informe_id_tipo_informe | id_tipo_informe | tipo_informe(id_tipo_informe) NOT VALID |
| informe_id_usuario | id_usuario | usuario(id_usuario) NOT VALID |
| informe_id_historia_clinica_fkey | id_historia_clinica | historia_clinica(id_historia_clinica) |

**Índices:** `informe_pkey` (UNIQUE, PK) sobre `(id_informe)`.

---

### 11. informe_documento

Tabla de unión N:M entre informe y documento.

| Columna | Tipo | ¿NULL? | Default |
|---------|------|--------|---------|
| id_documento | integer | NO | — |
| id_informe | integer | NO | — |

**Clave primaria (PK):** `pkey_informe_documento` → `(id_documento, id_informe)`

**Claves foráneas:**
| Constraint | Columna(s) | Referencia |
|------------|------------|------------|
| fk_id_documento | id_documento | documento(id_documento) |
| fk_id_informe | id_informe | informe(id_informe) |

**Índices:** `pkey_informe_documento` (UNIQUE, PK) sobre `(id_documento, id_informe)`.

---

### 12. modulo

Catálogo de módulos del sistema.

| Columna | Tipo | ¿NULL? | Default |
|---------|------|--------|---------|
| id_modulo | integer | NO | nextval('modulo_id_modulo_seq') |
| descripcion | character varying(100) | NO | — |

**Clave primaria (PK):** `modulo_pkey` → `(id_modulo)`

**Claves foráneas:** Ninguna.

**Índices:** `modulo_pkey` (UNIQUE, PK) sobre `(id_modulo)`.

---

### 13. mutual

Catálogo de mutuales / obras sociales.

| Columna | Tipo | ¿NULL? | Default |
|---------|------|--------|---------|
| id_mutual | integer | NO | nextval('mutual_id_mutual_seq') |
| nombre | character varying(50) | NO | — |

**Clave primaria (PK):** `mutual_pkey` → `(id_mutual)`

**Claves foráneas:** Ninguna.

**Índices:** `mutual_pkey` (UNIQUE, PK) sobre `(id_mutual)`.

---

### 14. paciente

Pacientes: datos personales, dirección (ciudad), prestación, hash_id, ocupación, etc.

| Columna | Tipo | ¿NULL? | Default |
|---------|------|--------|---------|
| dni_paciente | bigint | NO | — |
| nombre | character varying(50) | SÍ | — |
| apellido | character varying(50) | SÍ | — |
| fecha_nacimiento | date | NO | — |
| telefono | bigint | SÍ | — |
| inactivo | boolean | SÍ | false |
| id_prestacion | integer | SÍ | — |
| calle | character varying(50) | SÍ | — |
| barrio | character varying(50) | SÍ | — |
| id_ciudad | bigint | SÍ | — |
| piso_departamento | character varying(50) | SÍ | — |
| hash_id | character varying(64) | SÍ | — |
| vive_con | character varying(100) | SÍ | — |
| ocupacion_actual | character varying(100) | SÍ | — |
| ocupacion_anterior | character varying(100) | SÍ | — |
| numero_calle | character varying(10) | SÍ | — |

**Clave primaria (PK):** `paciente_pkey` → `(dni_paciente)`

**Claves foráneas:**
| Constraint | Columna(s) | Referencia |
|------------|------------|------------|
| paciente_id_prestacion_fkey | id_prestacion | prestacion(id_prestacion) |
| paciente_id_ciudad_fkey | id_ciudad | ciudad(id_ciudad) |

**Índices:** `paciente_pkey` (UNIQUE, PK) sobre `(dni_paciente)`.

---

### 15. prestacion

Tipos de prestación (ej. consultorio, internación).

| Columna | Tipo | ¿NULL? | Default |
|---------|------|--------|---------|
| id_prestacion | integer | NO | nextval('prestacion_id_prestacion_seq') |
| nombre | character varying(100) | NO | — |

**Clave primaria (PK):** `prestacion_pkey` → `(id_prestacion)`

**Claves foráneas:** Ninguna.

**Índices:** `prestacion_pkey` (UNIQUE, PK) sobre `(id_prestacion)`.

---

### 16. profesional

Profesionales de salud; vínculo 1:1 con usuario.

| Columna | Tipo | ¿NULL? | Default |
|---------|------|--------|---------|
| id_profesional | integer | NO | nextval('profesional_id_profesional_seq') |
| id_usuario | integer | NO | — |

**Clave primaria (PK):** `profesional_pkey` → `(id_profesional)`

**Claves foráneas:**
| Constraint | Columna(s) | Referencia |
|------------|------------|------------|
| profesional_id_usuario_fkey | id_usuario | usuario(id_usuario) |

**Índices:** `profesional_pkey` (UNIQUE, PK) sobre `(id_profesional)`.

---

### 17. profesional_especialidad

Relación N:M entre profesional y especialidad.

| Columna | Tipo | ¿NULL? | Default |
|---------|------|--------|---------|
| id_profesional | integer | NO | — |
| id_especialidad | integer | NO | — |

**Clave primaria (PK):** `profesional_especialidad_pkey` → `(id_profesional, id_especialidad)`

**Claves foráneas:**
| Constraint | Columna(s) | Referencia |
|------------|------------|------------|
| profesional_especialidad_id_profesional_fkey | id_profesional | profesional(id_profesional) |
| profesional_especialidad_id_especialidad_fkey | id_especialidad | especialidad(id_especialidad) |

**Índices:** `profesional_especialidad_pkey` (UNIQUE, PK) sobre `(id_profesional, id_especialidad)`.

---

### 18. provincia

Catálogo de provincias.

| Columna | Tipo | ¿NULL? | Default |
|---------|------|--------|---------|
| id_provincia | integer | NO | nextval('provincia_id_provincia_seq') |
| nombre | character varying(100) | SÍ | — |

**Clave primaria (PK):** `provincia_pkey` → `(id_provincia)`

**Claves foráneas:** Ninguna.

**Índices:** `provincia_pkey` (UNIQUE, PK) sobre `(id_provincia)`.

---

### 19. rate_limit

Almacén de rate limiting (key, contador, reset_time).

| Columna | Tipo | ¿NULL? | Default |
|---------|------|--------|---------|
| key | character varying(50) | NO | — |
| count | integer | NO | 0 |
| reset_time | timestamp with time zone | NO | — |

**Clave primaria (PK):** `rate_limit_pkey` → `(key)`

**Claves foráneas:** Ninguna.

**Índices:** `rate_limit_pkey` (UNIQUE, PK) sobre `(key)`.

---

### 20. refresh_token

Tokens de refresco para sesiones (por usuario, con expiración y revocación).

| Columna | Tipo | ¿NULL? | Default |
|---------|------|--------|---------|
| id_refresh_token | integer | NO | nextval('refresh_token_id_refresh_token_seq') |
| id_usuario | integer | NO | — |
| token | text | NO | — |
| created_at | timestamp with time zone | NO | now() |
| expires_at | timestamp with time zone | NO | — |
| revoked_at | timestamp with time zone | SÍ | — |
| user_agent | text | SÍ | — |
| ip_address | text | SÍ | — |

**Clave primaria (PK):** `refresh_token_pkey` → `(id_refresh_token)`

**Restricción UNIQUE:** `refresh_token_token_key` → `(token)`

**Claves foráneas:**
| Constraint | Columna(s) | Referencia |
|------------|------------|------------|
| refresh_token_id_usuario_fkey | id_usuario | usuario(id_usuario) ON DELETE CASCADE |

**Índices:**
| Nombre | Único | Columnas |
|--------|-------|----------|
| refresh_token_pkey | SÍ | (id_refresh_token) |
| refresh_token_token_key | SÍ | (token) |
| idx_refresh_token_user | NO | (id_usuario) |
| idx_refresh_token_expires | NO | (expires_at) |

---

### 21. tipo_informe

Catálogo de tipos de informe.

| Columna | Tipo | ¿NULL? | Default |
|---------|------|--------|---------|
| id_tipo_informe | integer | NO | nextval('tipo_informe_id_tipo_informe_seq') |
| descripcion | character varying(50) | SÍ | — |

**Clave primaria (PK):** `tipo_informe_pkey` → `(id_tipo_informe)`

**Claves foráneas:** Ninguna.

**Índices:** `tipo_informe_pkey` (UNIQUE, PK) sobre `(id_tipo_informe)`.

---

### 22. tipo_usuario

Roles o tipos de usuario (ej. admin, profesional, recepción).

| Columna | Tipo | ¿NULL? | Default |
|---------|------|--------|---------|
| id_tipo_usuario | integer | NO | — |
| descripcion | character varying(50) | NO | — |

**Clave primaria (PK):** `tipo_usuario_pkey` → `(id_tipo_usuario)`

**Claves foráneas:** Ninguna.

**Índices:** `tipo_usuario_pkey` (UNIQUE, PK) sobre `(id_tipo_usuario)`.

---

### 23. tutor

Tutores de pacientes (relación, convivencia, ocupación, etc.).

| Columna | Tipo | ¿NULL? | Default |
|---------|------|--------|---------|
| id_tutor | integer | NO | nextval('tutor_id_tutor_seq') |
| dni_paciente | bigint | SÍ | — |
| dni | bigint | NO | — |
| nombre | character varying(50) | SÍ | — |
| fecha_nacimiento | date | SÍ | — |
| relacion | character varying(50) | SÍ | — |
| ocupacion | character varying(50) | SÍ | — |
| convive | boolean | SÍ | — |
| lugar_nacimiento | character varying(100) | SÍ | — |

**Clave primaria (PK):** `tutor_pkey` → `(id_tutor)`

**Claves foráneas:**
| Constraint | Columna(s) | Referencia |
|------------|------------|------------|
| tutor_dni_paciente_fkey | dni_paciente | paciente(dni_paciente) |

**Índices:** `tutor_pkey` (UNIQUE, PK) sobre `(id_tutor)`.

---

### 24. usuario

Usuarios del sistema (login, tipo, DNI, email, hash_id, expiración).

| Columna | Tipo | ¿NULL? | Default |
|---------|------|--------|---------|
| id_usuario | integer | NO | nextval('usuario_id_usuario_seq') |
| nombre | character varying(50) | SÍ | — |
| apellido | character varying(50) | SÍ | — |
| email | character varying(100) | NO | — |
| fecha_nacimiento | date | SÍ | — |
| id_tipo_usuario | integer | NO | — |
| inactivo | boolean | SÍ | false |
| dni_usuario | numeric(9,0) | NO | — |
| expired_at | timestamp with time zone | SÍ | — |
| hash_id | character varying(64) | SÍ | — |

**Clave primaria (PK):** `usuario_pkey` → `(id_usuario)`

**Restricciones UNIQUE:** `unique_dni` → `(dni_usuario)`, `unique_email` → `(email)`

**Claves foráneas:**
| Constraint | Columna(s) | Referencia |
|------------|------------|------------|
| usuario_id_tipo_usuario_fkey | id_tipo_usuario | tipo_usuario(id_tipo_usuario) |

**Índices:**
| Nombre | Único | Columnas |
|--------|-------|----------|
| usuario_pkey | SÍ | (id_usuario) |
| unique_dni | SÍ | (dni_usuario) |
| unique_email | SÍ | (email) |

---

## Resumen de relaciones (FK)

| Tabla origen | Columna(s) FK | Tabla destino |
|--------------|----------------|---------------|
| anexo | id_informe, id_usuario | informe, usuario |
| ciudad | id_provincia | provincia |
| dato_mutual | id_mutual, dni_paciente | mutual, paciente |
| documento | dni_paciente, id_usuario | paciente, usuario |
| estudio_medico | dni_paciente | paciente |
| hc_fisiatrica | id_historia_clinica | historia_clinica |
| historia_clinica | id_modulo, id_profesional, dni_paciente | modulo, profesional, paciente |
| informe | dni_paciente, id_especialidad, id_tipo_informe, id_usuario, id_historia_clinica | paciente, especialidad, tipo_informe, usuario, historia_clinica |
| informe_documento | id_documento, id_informe | documento, informe |
| paciente | id_prestacion, id_ciudad | prestacion, ciudad |
| profesional | id_usuario | usuario |
| profesional_especialidad | id_profesional, id_especialidad | profesional, especialidad |
| refresh_token | id_usuario | usuario |
| tutor | dni_paciente | paciente |
| usuario | id_tipo_usuario | tipo_usuario |

---

*Documento generado a partir del esquema `public` de PostgreSQL.*
