import { Router } from 'express';
import { PatientController } from '../controllers/patient.controller.js';
import { PatientSchema } from '../schemas/patient.schema.js';
import { validate } from '../middlewares/validate.middleware.js';
import { getPatientDni } from '../middlewares/dniPaciente.middleware.js';
import { requireRole } from '../middlewares/authorization.middleware.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

// ! localhost:3000/api/patient

router.put(
  '/activate/:hash_id',
  requireRole([ROLES.ADMINISTRACION]),
  PatientController.reactivatePatient,
);
router.get('/:hash_id', getPatientDni, PatientController.getPatient);
router.put('/:hash_id', getPatientDni, PatientController.updatePatient);
router.delete(
  '/delete/:hash_id',
  requireRole([ROLES.ADMINISTRACION]),
  getPatientDni,
  PatientController.deletePatient,
);
router.post(
  '/',
  validate(PatientSchema.patient),
  PatientController.postPatient,
);
router.get('/', PatientController.getPatients);
export { router };
