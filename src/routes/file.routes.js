import { Router } from 'express';
import { FileControlller } from '../controllers/file.controller.js';
import { getPatientDni } from '../middlewares/dniPaciente.middleware.js';

const router = Router();

//! http://localhost:3000/api/file/

router.post('/upload', getPatientDni, FileControlller.uploadFile);
router.get('/', getPatientDni, FileControlller.getFiles);

export { router };
