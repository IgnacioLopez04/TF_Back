import { Router } from 'express';

const router = Router();

router.post('/login', AuthController.login);
router.post('/reset', AuthController.resetPassword);

/*
 * La idea es realizar un login, reset password.
 *
 * Ademas, pensaba de resetear el token cada vez que se interactue con el back.
 *
 * Para iniciar sesion por primera vez, tendra que reseater la password, cada 6 meses tendra que cambiar la password.
 */

export { router };
