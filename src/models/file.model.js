import { pool } from '../configs/config.js';
import { DefaultError, InternalServerError } from '../errors/errors.js';

export class FileModel {
  static async insertMedicalFile(
    dni_paciente,
    nombre_estudio,
    descripcion,
    path,
  ) {
    try {
      await pool.query(
        `
                INSERT INTO estudio_medico(dni_paciente, nombre_estudio, descripcion, path)
                VALUES($1, $2, $3, $4)    
            `,
        [dni_paciente, nombre_estudio, descripcion, path],
      );
    } catch (err) {
      throw new InternalServerError('Error al cargar los estudios.');
    }
  }
  static async getMedicalFile(id_estudio, id_paciente) {
    try {
      const file = await pool.query(
        'SELECT * FROM estudio_medico WHERE id_estudio= $1 AND id_paciente=$2',
        [id_estudio, id_paciente],
      );
      return file.rows[0];
    } catch (err) {
      throw new InternalServerError('Error al obtener el estudio.');
    }
  }
  static async insertFile(
    dni_paciente,
    id_usuario,
    path,
    nombre,
    tipo_archivo,
    fileKey,
    titulo,
    descripcion,
  ) {
    try {
      const file = await pool.query(
        `INSERT INTO documento (dni_paciente, id_usuario, path, nombre, tipo_archivo, key, titulo, descripcion) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id_documento`,
        [
          dni_paciente,
          id_usuario,
          path,
          nombre,
          tipo_archivo,
          fileKey,
          titulo,
          descripcion,
        ],
      );
      return file.rows[0].id_documento;
    } catch (err) {
      throw new InternalServerError('Error al insertar los documentos.');
    }
  }
  static async getFiles(dni_paciente, tipo_archivo) {
    try {
      let query;
      let params;

      // Si tipo_archivo es null o undefined, obtener todos los documentos
      if (tipo_archivo === null || tipo_archivo === undefined) {
        query = `SELECT * FROM documento WHERE dni_paciente=$1 ORDER BY id_documento DESC`;
        params = [dni_paciente];
      } else {
        // Si se proporciona tipo_archivo, filtrar por tipo
        query = `SELECT * FROM documento WHERE dni_paciente=$1 AND tipo_archivo=$2 ORDER BY id_documento DESC`;
        params = [dni_paciente, tipo_archivo];
      }

      const files = await pool.query(query, params);
      return files.rows;
    } catch (err) {
      throw new InternalServerError('Error al recuperar los documentos.');
    }
  }
}
