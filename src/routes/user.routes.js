import { Router } from 'express';
import { UserController } from '../controllers/user.controller.js';
import { requireRole } from '../middlewares/authorization.middleware.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

// ! localhost:3000/api/user

router.post(
  '/create',
  requireRole([ROLES.ADMINISTRACION]),
  UserController.insertUser,
);
router.get(
  '/AllActives',
  requireRole([ROLES.ADMINISTRACION]),
  UserController.getActiveUsers,
);
router.get(
  '/type',
  requireRole([ROLES.ADMINISTRACION]),
  UserController.getUserType,
);
router.put(
  '/:hash_id',
  requireRole([ROLES.ADMINISTRACION]),
  UserController.updateUser,
);
router.get(
  '/:dni',
  requireRole([ROLES.ADMINISTRACION]),
  UserController.getUser,
);
router.get('/', requireRole([ROLES.ADMINISTRACION]), UserController.getUsers);
router.delete(
  '/:hash_id',
  requireRole([ROLES.ADMINISTRACION]),
  UserController.blockUser,
);
router.put(
  '/expiration',
  requireRole([ROLES.ADMINISTRACION]),
  UserController.updateExpiredAt,
);
router.put(
  '/activate/:hash_id',
  requireRole([ROLES.ADMINISTRACION]),
  UserController.activateUser,
);

export { router };
