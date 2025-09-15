# Middleware getPatientDni - Uso y Documentación

## Descripción
El middleware `getPatientDni` se encarga de obtener el DNI del paciente basado en el `hash_id` proporcionado en los parámetros de la URL y lo agrega al objeto `request` para evitar consultas repetidas en los controladores.

## Funcionalidad
- Extrae el `hash_id` de `req.params`
- Limpia el hash_id eliminando comillas dobles si las tiene
- Busca el DNI del paciente en la base de datos
- Valida que el paciente exista y esté activo
- Agrega `req.dni_paciente` y `req.hash_id` (limpio) al request
- Pasa el control al siguiente middleware/controlador

## Uso en Rutas

### Importación
```javascript
import { getPatientDni } from '../middlewares/dniPaciente.middleware.js';
```

### Ejemplo de uso en rutas
```javascript
// Ruta que necesita el DNI del paciente
router.get('/:hash_id/medical-history', getPatientDni, MedicalController.getHistory);

// Ruta que necesita el DNI para crear un registro
router.post('/:hash_id/medical-record', getPatientDni, MedicalController.createRecord);

// Ruta que necesita el DNI para actualizar datos
router.put('/:hash_id/update', getPatientDni, PatientController.updatePatient);
```

## Uso en Controladores

### Antes (sin middleware)
```javascript
static async getPatient(req, res, next) {
  const { hash_id } = req.params;
  if (!hash_id) throw new BadRequestError('Hash ID no proporcionado.');
  
  const cleanId = cleanHashId(hash_id);
  
  try {
    const patient = await PatientModel.getPatient(cleanId);
    if (!patient) throw new NotFoundError('Paciente no encontrado.');
    
    // Usar patient.dni_paciente para operaciones...
  } catch (err) {
    next(err);
  }
}
```

### Después (con middleware)
```javascript
static async getPatient(req, res, next) {
  // El DNI ya está disponible en req.dni_paciente
  // El hash_id ya está limpio en req.hash_id
  const { dni_paciente, hash_id } = req;
  
  try {
    const patient = await PatientModel.getPatient(hash_id);
    // Usar dni_paciente directamente para operaciones...
  } catch (err) {
    next(err);
  }
}
```

## Datos Disponibles en el Request

Después de ejecutar el middleware, el objeto `req` contendrá:

- `req.dni_paciente`: DNI del paciente (string)
- `req.hash_id`: Hash ID limpio del paciente (string)

## Manejo de Errores

El middleware maneja automáticamente los siguientes errores:

- `BadRequestError`: Cuando no se proporciona el hash_id
- `NotFoundError`: Cuando el paciente no existe o está inactivo
- `InternalServerError`: Cuando hay errores de base de datos

## Ventajas

1. **Evita consultas repetidas**: No necesitas buscar el DNI en cada controlador
2. **Centraliza la validación**: La validación del paciente se hace en un solo lugar
3. **Mejora el rendimiento**: Una sola consulta optimizada en lugar de consultas completas
4. **Código más limpio**: Los controladores se enfocan en su lógica específica
5. **Consistencia**: Mismo comportamiento en todos los endpoints que lo usen

## Ejemplo Completo

### Ruta
```javascript
router.get('/:hash_id/reports', getPatientDni, ReportController.getPatientReports);
```

### Controlador
```javascript
static async getPatientReports(req, res, next) {
  const { dni_paciente } = req; // Ya disponible gracias al middleware
  
  try {
    const reports = await ReportModel.getByPatientDni(dni_paciente);
    return res.json(reports);
  } catch (err) {
    next(err);
  }
}
```

## Notas Importantes

- El middleware debe colocarse **antes** del controlador en la cadena de middlewares
- Solo funciona con rutas que tengan `:hash_id` como parámetro
- El paciente debe estar activo (inactivo = false) para que el middleware funcione
- Si necesitas más datos del paciente, usa `PatientModel.getPatient()` con el `req.hash_id` ya limpio
