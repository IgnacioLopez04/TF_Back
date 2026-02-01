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
  static async insertDatosMutual({ id_mutual, dni_paciente, numero_afiliado }) {
    try {
      await pool.query(
        'INSERT INTO dato_mutual (id_mutual, dni_paciente, numero_afiliado) VALUES ($1, $2, $3)',
        [id_mutual, dni_paciente, numero_afiliado],
      );
    } catch (error) {
      throw new InternalServerError('Error al insertar los datos de la mutual.');
    }
  }
  static async getDatosMutualByDniPaciente(dni_paciente) {
    try {
      const { rows } = await pool.query(
        'SELECT id_mutual, numero_afiliado FROM dato_mutual WHERE dni_paciente = $1 ORDER BY id_datos_mutual LIMIT 1',
        [dni_paciente],
      );
      return rows[0] || null;
    } catch (error) {
      throw new InternalServerError('Error al obtener los datos de la mutual.');
    }
  }
  static async upsertDatosMutual(dni_paciente, id_mutual, numero_afiliado) {
    try {
      const r = await pool.query(
        'UPDATE dato_mutual SET id_mutual = $1, numero_afiliado = $2 WHERE dni_paciente = $3',
        [id_mutual, numero_afiliado, dni_paciente],
      );
      if (r.rowCount === 0) {
        await pool.query(
          'INSERT INTO dato_mutual (id_mutual, dni_paciente, numero_afiliado) VALUES ($1, $2, $3)',
          [id_mutual, dni_paciente, numero_afiliado],
        );
      }
    } catch (error) {
      throw new InternalServerError('Error al actualizar los datos de la mutual.');
    }
  }
  static async deleteDatosMutualByDniPaciente(dni_paciente) {
    try {
      await pool.query('DELETE FROM dato_mutual WHERE dni_paciente = $1', [
        dni_paciente,
      ]);
    } catch (error) {
      throw new InternalServerError('Error al eliminar los datos de la mutual.');
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

  static async getTutoresByDniPaciente(dni_paciente) {
    try {
      const { rows } = await pool.query(
        'SELECT dni, nombre, fecha_nacimiento, ocupacion, relacion, convive, lugar_nacimiento FROM tutor WHERE dni_paciente = $1 ORDER BY id_tutor',
        [dni_paciente]
      );
      return rows;
    } catch (error) {
      throw new InternalServerError('Error al obtener los tutores.');
    }
  }
}
