import { Router } from 'express';
import { FileControlller } from '../controllers/file.controller.js';

const router = Router();

//! http://localhost:3000/api/file/

router.post('/upload', FileControlller.uploadFile);
router.get('/', FileControlller.getFiles);

export { router };
