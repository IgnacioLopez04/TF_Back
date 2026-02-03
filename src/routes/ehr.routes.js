import { Router } from 'express';
import { EHRController } from '../controllers/ehr.controller.js';
import { getPatientDni } from '../middlewares/dniPaciente.middleware.js';

const router = Router();
// ! localhost:3000/api/ehr

router.post('/hc-fisiatric', getPatientDni, EHRController.hcFisiatric);
router.get(
  '/hc-fisiatric/:hash_id/history',
  getPatientDni,
  EHRController.getHCFisiatricHistory,
);
router.get(
  '/hc-fisiatric/:hash_id',
  getPatientDni,
  EHRController.getHCFisiatric,
);
export { router };
