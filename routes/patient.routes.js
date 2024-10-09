import { Router } from 'express'
import { PatientController } from '../controllers/patient.controller.js'

export const patientRouter = Router()

patientRouter.get('/', PatientController.getPatient)
