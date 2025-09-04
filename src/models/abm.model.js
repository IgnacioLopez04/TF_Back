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

export class TutorModel {
  static async insertTutor(tutor) {
    try {
      await pool.query(
        'INSERT INTO tutor (dni_paciente, dni, nombre, fecha_nacimiento,ocupacion, relacion, convive, lugar_nacimiento) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
        [
          tutor.dni_paciente,
          tutor.dni,
          tutor.nombre,
          tutor.fechaNacimiento,
          tutor.ocupacion,
          tutor.relacion,
          tutor.convive,
          tutor.lugarNacimiento,
        ],
      );
    } catch (error) {
      throw new InternalServerError('Error al insertar el tutor.');
    }
  }
}
