# TF_Back



# 🏥 Historia Clínica Digital - Backend

Este proyecto forma parte del Trabajo Final de la carrera de Ingeniería en Informática. Consiste en el desarrollo de un sistema interoperable de Historia Clínica Digital para la Fundación Causana, utilizando una arquitectura basada en microservicios, con integración del estándar HL7 FHIR.

---

## 📦 Estructura del Proyecto

```
📁 controllers/     # Lógica de los endpoints HTTP
📁 models/          # Acceso a la base de datos y queries SQL
📁 routes/          # Enrutadores Express
📁 middlewares/     # Middleware de autenticación, manejo de errores, etc.
📁 uploads/         # Carpeta temporal de archivos multimedia
.env               # Variables de entorno (configuración)
app.js             # Configuración principal del servidor
```

---

## 🧰 Tecnologías

- **Node.js / Express**
- **PostgreSQL**
- **Express-fileupload / Multer** para manejo de archivos
- **JWT** para autenticación (se está implementado)

---

## 🚀 Cómo levantar el proyecto

### 1. Clonar el repositorio

```bash
git clone https://github.com/IgnacioLopez04/TF_Back.git
cd TF_Back
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Crear un archivo `.env` con:

```
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=tu_pass
DB_NAME=historia_clinica
```

### 4. Ejecutar en desarrollo

```bash
npm run dev
```

---

## 🛠 Endpoints principales

| Recurso         | Método | Ruta                             | Descripción                        |
|-----------------|--------|----------------------------------|------------------------------------|
| Usuarios        | GET    | `/api/usuarios`                  | Listado de usuarios                |
| Pacientes       | POST   | `/api/pacientes`                 | Alta de paciente                   |
| Profesionales   | PUT    | `/api/profesionales/:id`         | Modificación de datos              |
| Documentos      | POST   | `/api/documentos`                | Subida de archivo con metadata     |
| Documentos      | GET    | `/api/pacientes/:id/documentos`  | Listado de archivos de un paciente |

---

## 🔐 Seguridad

- Control de acceso basado en roles (en desarrollo).
- Middleware de manejo de errores.
- Validación de extensiones de archivos.
- Preparado para cifrado de datos sensibles.

---
## Server de prueba FHIR
[FHIR page](https://hapi.fhir.org)
[FHIR base](https://hapi.fhir.org/baseR5)

## 🧠 Autor

**Ignacio Ezequiel López**  
Trabajo Final de Carrera - Ingeniería en Informática  
Universidad Católica de Santiago del Estero - Dpto. Académico Rafaela
