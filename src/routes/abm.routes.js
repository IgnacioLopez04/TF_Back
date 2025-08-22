import { Router } from 'express';
import { UbicacionController } from '../controllers/abm.controller.js';

const router = Router();

router.post('/cargar-provincias', UbicacionController.cargarProvincias);
router.post('/cargar-ciudades', UbicacionController.cargarCiudades);

export { router };
