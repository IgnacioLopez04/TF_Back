// TODO - Aca voy a colocar todos los ABM de aquellas tablas que sea secundarias y pero necesarias para el sistema
// Mutual, Datos_mutual, Provincia, Ciudad, Barrio, codigo_postal, calle, prestacion, modulo, etc.
import axios from 'axios';
import { UbicacionModel } from '../models/abm.model.js';

//! Ubicacion
export class UbicacionController {
  static async cargarProvincias(req, res, next) {
    const provincias = await axios.get(
      'https://infra.datos.gob.ar/georef/provincias.json',
    );

    try {
      await Promise.all(
        provincias.data.provincias.map(async (provincia) => {
          await UbicacionModel.cargarProvincia(provincia.id, provincia.nombre);
        }),
      );
      res.status(201).json({ message: 'Provincias cargadas correctamente' });
    } catch (error) {
      next(error);
    }
  }
  static async cargarCiudades(req, res, next) {
    const localidades = await axios.get(
      'https://infra.datos.gob.ar/georef/localidades.json',
    );

    try {
      await Promise.all(
        localidades.data.localidades.map(async (localidad) => {
          await UbicacionModel.cargarCiudad(
            localidad.id,
            localidad.nombre,
            localidad.provincia.id,
          );
        }),
      );
      res.status(201).json({ message: 'Ciudades cargadas correctamente' });
    } catch (error) {
      next(error);
    }
  }
  static async obtenerProvincias(req, res, next) {
    try {
      const provincias = await UbicacionModel.obtenerProvincias();
      res.status(200).json(provincias);
    } catch (error) {
      next(error);
    }
  }
  static async obtenerCiudades(req, res, next) {
    const { id_provincia } = req.params;
    try {
      const ciudades = await UbicacionModel.obtenerCiudades(id_provincia);
      res.status(200).json(ciudades);
    } catch (error) {
      next(error);
    }
  }
}
