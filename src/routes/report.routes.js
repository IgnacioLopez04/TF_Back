import { Router } from 'express';
import { ReportController } from '../controllers/report.controller.js';

//! http://localhost:3000/api/report

const router = Router();

router.post('/create', ReportController.createReport);
router.post('/createAnnex', ReportController.createAnnex);
router.get('/:reportId', ReportController.getReport);
router.get('/all/:patientDni', ReportController.getReports);

export { router };
