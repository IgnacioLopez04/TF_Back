import { Router } from 'express';
import { PatientController } from '../controllers/patient.controller.js';

export const patientRouter = Router();

patientRouter.get('/', PatientController.getPatient);
// patientRouter.get('/', PatientController.getPatientCom)
patientRouter.post('/create', PatientController.postPatient);
