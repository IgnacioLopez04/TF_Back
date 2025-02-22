import { Router } from 'express';
import { PatientController } from '../controllers/patient.controller.js';

const router = Router();

// ! localhost:3000/api/patient

router.get('/:dni_paciente', PatientController.getPatient);
router.delete('/delete/:dni_paciente', PatientController.deletePatient);
router.post('/create', PatientController.postPatient);
router.get('/', PatientController.getPatients);
export { router };
