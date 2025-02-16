import { Router } from 'express';
import { UserController } from '../controllers/user.controller.js';

const router = Router();

// ! localhost:3000/api/user

router.post('/create', UserController.insertUser);
router.get('/AllActives', UserController.getActiveUsers);
router.get('/:dni', UserController.getUser);
router.get('/', UserController.getUsers);
router.delete('/:dni', UserController.deleteUser);

export { router };
