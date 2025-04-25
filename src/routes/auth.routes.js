import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';

const router = Router();

//! http://localhost:3000/api/auth/

router.post('/login', AuthController.login);

/*
 * La idea es realizar un login, reset password.
 *
 * Ademas, pensaba de resetear el token cada vez que se interactue con el back.
 *
 * Para iniciar sesion por primera vez, tendra que reseater la password, cada 6 meses tendra que cambiar la password.
 */

export { router };
