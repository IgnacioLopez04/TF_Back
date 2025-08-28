import { Router } from 'express';
import {
  UbicacionController,
  GeneralController,
} from '../controllers/abm.controller.js';

const router = Router();

//! General
router.get('/mutuales', GeneralController.obtenerMutuales);
router.get('/prestaciones', GeneralController.obtenerPrestaciones);

//! Ubicacion
router.post('/cargar-provincias', UbicacionController.cargarProvincias);
router.post('/cargar-ciudades', UbicacionController.cargarCiudades);
router.get('/provincias', UbicacionController.obtenerProvincias);
router.get('/ciudades/:id_provincia', UbicacionController.obtenerCiudades);

export { router };
