import { Router } from 'express';
import { PatientController } from '../controllers/patient.controller.js';

const router = Router();

// ! localhost:3000/api/patient

router.get('/', PatientController.getPatient);
// router.get('/', PatientController.getPatientCom)
router.post('/create', PatientController.postPatient);

export { router };
