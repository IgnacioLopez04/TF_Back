import { Router } from 'express';
import { ReportController } from '../controllers/report.controller.js';

//! http://localhost:3000/api/report

const router = Router();

router.post('/create', ReportController.createReport);

export { router };
