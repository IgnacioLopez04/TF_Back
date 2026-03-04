import { Router } from 'express';
import {
  UbicacionController,
  GeneralController,
} from '../controllers/abm.controller.js';
import { requireRole } from '../middlewares/authorization.middleware.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

//! General
router.get('/mutuales', GeneralController.obtenerMutuales);
router.get('/prestaciones', GeneralController.obtenerPrestaciones);

//! Ubicacion
router.post(
  '/cargar-provincias',
  requireRole([ROLES.ADMINISTRACION]),
  UbicacionController.cargarProvincias,
);
router.post(
  '/cargar-ciudades',
  requireRole([ROLES.ADMINISTRACION]),
  UbicacionController.cargarCiudades,
);
router.get('/provincias', UbicacionController.obtenerProvincias);
router.get('/ciudades/:id_provincia', UbicacionController.obtenerCiudades);

export { router };
