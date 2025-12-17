import { Router } from 'express';
import { UserController } from '../controllers/user.controller.js';
import { getPatientDni } from '../middlewares/dniPaciente.middleware.js';

const router = Router();

// ! localhost:3000/api/user

router.post('/create', UserController.insertUser);
router.get('/AllActives', UserController.getActiveUsers);
router.get('/type', UserController.getUserType);
router.put('/:hash_id', UserController.updateUser);
router.get('/:dni', UserController.getUser);
router.get('/', UserController.getUsers);
router.delete('/:hash_id', UserController.blockUser);
router.put('/expiration', UserController.updateExpiredAt);
router.put('/activate/:hash_id', UserController.activateUser);

export { router };
