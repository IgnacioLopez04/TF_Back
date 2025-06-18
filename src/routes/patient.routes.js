import { Router } from 'express';
import { PatientController } from '../controllers/patient.controller.js';
import { PatientSchema } from '../schemas/patient.schema.js';
import { validate } from '../middlewares/validate.middleware.js';

const router = Router();

// ! localhost:3000/api/patient

router.get('/:dni_paciente', PatientController.getPatient);
router.delete('/delete/:dni_paciente', PatientController.deletePatient);
router.post(
  '/',
  validate(PatientSchema.patient),
  PatientController.postPatient,
);
router.get('/', PatientController.getPatients);
export { router };
