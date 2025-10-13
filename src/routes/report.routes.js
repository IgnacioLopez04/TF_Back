import { Router } from 'express';
import { ReportController } from '../controllers/report.controller.js';
import { getPatientDni } from '../middlewares/dniPaciente.middleware.js';

//! http://localhost:3000/api/report

const router = Router();

router.post('/create', ReportController.createReport);
router.post('/:reportId/createAnnex', ReportController.createAnnex);
// router.get('/:reportId/comentarios', ReportController.getAnnex);
router.get('/:reportId', ReportController.getReport);
router.get('/all/:hash_id', getPatientDni, ReportController.getReports);
router.get('/:reportHashId/annexes', ReportController.getAnnexByReport);

export { router };
