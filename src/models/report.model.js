import { pool } from '../configs/config.js';
import { DefaultError, InternalServerError } from '../errors/errors.js';

export class ReportModel {
  static async insertReport(
    id_usuario,
    dni_paciente,
    reporte,
    id_tipo_informe,
    titulo,
    id_especialidad,
    id_historia_clinica,
  ) {
    try {
      const response = await pool.query(
        `
               INSERT INTO informe(id_usuario, dni_paciente, reporte, id_especialidad, titulo, id_tipo_informe, id_historia_clinica, hash_id)
               VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id_informe
            `,
        [
          id_usuario,
          dni_paciente,
          reporte,
          id_especialidad,
          titulo,
          id_tipo_informe,
          id_historia_clinica,
          hash_id,
        ],
      );
      return response.rows[0].id_informe;
    } catch (error) {
      throw new InternalServerError('Error al crear el informe.');
    }
  }
  static async getReport(hash_id) {
    try {
      const report = await pool.query(
        `SELECT * FROM informe WHERE hash_id = $1`,
        [hash_id],
      );
      return report.rows[0];
    } catch (error) {
      throw new InternalServerError('Error al obtener el informe.');
    }
  }
  static async getReports(dni_paciente) {
    try {
      const report = await pool.query(
        `
          SELECT i.id_informe, u.nombre AS nombre_usuario, u.dni_usuario, u.apellido AS apellido_usuario, i.fecha_creacion, i.titulo, i.reporte, ti.descripcion AS nombre_tipo_informe, i.hash_id as hash_id
          FROM informe AS i
          INNER JOIN usuario AS u ON u.id_usuario = i.id_usuario
          INNER JOIN tipo_informe AS ti ON ti.id_tipo_informe = i.id_tipo_informe
          WHERE i.dni_paciente = $1
          ORDER BY fecha_creacion DESC
        `,
        [dni_paciente],
      );
      return report.rows;
    } catch (error) {
      throw new InternalServerError('Error al obtener los informes.');
    }
  }
  static async insertAnnex(id_informe, id_usuario, text, hash_id) {
    try {
      const report = await pool.query(
        `SELECT * FROM informe WHERE id_informe=$1`,
        [id_informe],
      );
      if (report.rows[0].length === 0) {
        throw new NotFoundError('Error al encontrar el informe.');
      }

      const response = await pool.query(
        `
          INSERT INTO anexo(id_informe, id_usuario, reporte, hash_id)
          VALUES($1,$2,$3,$4)
      `,
        [id_informe, id_usuario, text, hash_id],
      );
      return;
    } catch (error) {
      if (error.statusCode === 404) {
        return error;
      } else {
        throw new InternalServerError('Error al crear el anexo.');
      }
    }
  }
  static async getAllAnnexByReport(id_informe) {
    try {
      const report = await pool.query(
        `SELECT * FROM informe WHERE id_informe=$1`,
        [id_informe],
      );
      if (report.rows[0].length === 0) {
        throw new NotFoundError('Error al encontrar el informe.');
      }

      const annexies = await pool.query(
        ` 
        SELECT a.*, u.nombre AS nombre_usuario, u.apellido AS apellido_usuario
        FROM anexo AS a
        INNER JOIN usuario AS u ON u.id_usuario = a.id_usuario
        WHERE a.id_informe = $1
        ORDER BY a.fecha_creacion DESC
        `,
        [id_informe],
      );
      return annexies.rows;
    } catch (error) {
      if (error.statusCode === 404) {
        return error;
      } else {
        throw new InternalServerError('Error al consultar los anexos.');
      }
    }
  }
  static async addFileReport(id_informe, id_documento) {
    try {
      await pool.query(
        'INSERT INTO informe_documento(id_documento, id_informe) VALUES($1,$2)',
        [id_documento, id_informe],
      );
    } catch (err) {
      throw new InternalServerError('Error al agregar el documento al informe');
    }
  }
}
