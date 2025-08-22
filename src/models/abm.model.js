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
}
