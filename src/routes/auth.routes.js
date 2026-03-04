import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';

const router = Router();

//! http://localhost:3000/auth/

router.post('/login', AuthController.login);
router.post('/refresh', AuthController.refresh);
router.post('/logout', AuthController.logout);

export { router };
