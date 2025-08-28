import { pool } from '../configs/config.js';
import { InternalServerError } from '../errors/errors.js';

export class UbicacionModel {
  static async cargarProvincia(id, nombre) {
    try {
      await pool.query(
        'INSERT INTO provincia (id_provincia, nombre) VALUES ($1, $2)',
        [id, nombre],
      );
    } catch (error) {
      throw new InternalServerError('Error al cargar la provincia.');
    }
  }
  static async cargarCiudad(id_ciudad, nombre, id_provincia) {
    try {
      await pool.query(
        'INSERT INTO ciudad (id_ciudad, nombre, id_provincia) VALUES ($1, $2, $3)',
        [id_ciudad, nombre, id_provincia],
      );
    } catch (error) {
      console.log(error);
      throw new InternalServerError('Error al cargar la ciudad.');
    }
  }
  static async obtenerProvincias() {
    try {
      const { rows } = await pool.query(
        'SELECT * FROM provincia ORDER BY nombre',
      );
      return rows;
    } catch (error) {
      throw new InternalServerError('Error al obtener las provincias.');
    }
  }
  static async obtenerCiudades(id_provincia) {
    try {
      const { rows } = await pool.query(
        'SELECT id_ciudad, nombre FROM ciudad WHERE id_provincia = $1 ORDER BY nombre',
        [id_provincia],
      );
      return rows;
    } catch (error) {
      throw new InternalServerError('Error al obtener las ciudades.');
    }
  }
}

export class GeneralModel {
  static async obtenerMutuales() {
    try {
      const { rows } = await pool.query('SELECT * FROM mutual ORDER BY nombre');
      return rows;
    } catch (error) {
      throw new InternalServerError('Error al obtener las mutuales.');
    }
  }
  static async obtenerPrestaciones() {
    try {
      const { rows } = await pool.query(
        'SELECT * FROM prestacion ORDER BY nombre',
      );
      return rows;
    } catch (error) {
      throw new InternalServerError('Error al obtener las prestaciones.');
    }
  }
}
