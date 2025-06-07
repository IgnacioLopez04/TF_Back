import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';

const router = Router();

//! http://localhost:3000/api/auth/

router.post('/login', AuthController.login);

export { router };
