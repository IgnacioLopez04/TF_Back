import { PatientModel } from '../models/patient.model.js';
import { BadRequestError, NotFoundError } from '../errors/errors.js';
import { cleanHashId } from '../utils/encrypt.js';

/**
 * Middleware que obtiene el DNI del paciente basado en el hashId
 * y lo agrega al request para evitar consultas repetidas
 */
export const getPatientDni = async (req, res, next) => {
  try {
    // Obtener hashId de los parámetros de la URL, query params o del body
    const hash_id = req.params.hash_id || req.query.hash_id || req.body.hash_id;

    if (!hash_id) {
      throw new BadRequestError('Hash ID del paciente no proporcionado.');
    }

    // Limpiar el hash_id eliminando comillas dobles si las tiene
    const cleanId = cleanHashId(hash_id);

    // Buscar el DNI del paciente en la base de datos
    const dni_paciente = await PatientModel.getPatientDni(cleanId);

    if (!dni_paciente) {
      throw new NotFoundError('Paciente no encontrado o inactivo.');
    }

    // Agregar el DNI al objeto request para uso posterior
    req.dni_paciente = dni_paciente;
    req.hash_id = cleanId;

    next();
  } catch (error) {
    next(error);
  }
};
