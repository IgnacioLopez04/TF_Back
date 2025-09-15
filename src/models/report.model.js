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
               INSERT INTO informe(id_usuario, dni_paciente, reporte, id_especialidad, titulo, id_tipo_informe, id_historia_clinica)
               VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id_informe
            `,
        [
          id_usuario,
          dni_paciente,
          reporte,
          id_especialidad,
          titulo,
          id_tipo_informe,
          id_historia_clinica,
        ],
      );
      return response.rows[0].id_informe;
    } catch (error) {
      throw new InternalServerError('Error al crear el informe.');
    }
  }
  static async getReport(id_informe) {
    try {
      const report = await pool.query(
        `SELECT * FROM informe WHERE id_informe = $1`,
        [id_informe],
      );
      return report.rows[0];
    } catch (error) {
      throw new InternalServerError('Error al obtener el informe.');
    }
  }
  static async getReports(dni_paciente) {
    try {
      const report = await pool.query(
        `SELECT * FROM informe WHERE dni_paciente = $1`,
        [dni_paciente],
      );
      return report.rows;
    } catch (error) {
      throw new InternalServerError('Error al obtener los informes.');
    }
  }
  static async insertAnnex(id_informe, id_usuario, text) {
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
          INSERT INTO anexo(id_informe, id_usuario, reporte)
          VALUES($1,$2,$3)
      `,
        [id_informe, id_usuario, text],
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
        `SELECT * FROM anexo WHERE id_informe = $1`,
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
