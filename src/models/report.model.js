import { pool } from '../configs/config.js';
import { DefaultError } from '../errors/errors.js';

export class ReportModel {
   static async insertReport(
      id_usuario,
      dni_paciente,
      reporte,
      id_tipo_informe,
      titulo,
      id_especialidad,
   ) {
      try {
         const response = await pool.query(
            `
               INSERT INTO informe(id_usuario, dni_paciente, reporte, id_especialidad, titulo, id_tipo_informe)
               VALUES($1,$2,$3,$4,$5,$6) RETURNING id_informe
            `,
            [
               id_usuario,
               dni_paciente,
               reporte,
               id_especialidad,
               titulo,
               id_tipo_informe,
            ],
         );
         return response.rows[0].id_informe;
      } catch (error) {
         throw new DefaultError(
            'DatabaseError',
            'Error al crear el informe.',
            500,
         );
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
         throw new DefaultError(
            'DatabaseError',
            'Error al obtener el informe.',
            500,
         );
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
         throw new DefaultError(
            'DatabaseError',
            'Error al obtener los informes.',
            500,
         );
      }
   }
   static async insertAnnex(id_informe, id_usuario, text) {
      try {
         const report = await pool.query(
            `SELECT * FROM informe WHERE id_informe=$1`,
            [id_informe],
         );
         if (report.rows[0].length === 0) {
            throw new DefaultError(
               'NotFoundError',
               'Error al encontrar el informe.',
               404,
            );
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
            throw new DefaultError(
               'DatabaseError',
               'Error al crear el anexo.',
               500,
            );
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
            throw new DefaultError(
               'NotFoundError',
               'Error al encontrar el informe.',
               404,
            );
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
            throw new DefaultError(
               'DatabaseError',
               'Error al consultar los anexos.',
               500,
            );
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
         throw new DefaultError(
            'DatabaseError',
            'Error al agregar el documento al informe',
            500,
         );
      }
   }
}
