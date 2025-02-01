import { pool } from '../configs/config';
import { DefaultError } from '../errors/errors';

export class reportModel {
   static async insertReport(id_profesional, dni_paciente, report) {
      try {
         const response = await pool.query(
            `
               INSERT INTO informe(id_profesional, dni_paciente, reporte)
               VALUES($1,$2,$3)
            `,
            [id_profesional, dni_paciente, report],
         );
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
         const report = pool.query(
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
   static async getReport() {
      try {
         const report = await pool.query(`SELECT * FROM informe`);
         return report.rows;
      } catch (error) {
         throw new DefaultError(
            'DatabaseError',
            'Error al obtener los informes.',
            500,
         );
      }
   }
   static async insertAnnex(id_informe, id_profesional, report) {
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
               INSERT INTO anexo(id_informe, id_profesional, reporte)
               VALUES($1,$2,$3)
            `,
            [id_informe, id_profesional, report],
         );
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
}
