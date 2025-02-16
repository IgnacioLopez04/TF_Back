import { pool } from '../configs/config';
import { DefaultError } from '../errors/errors';

export class SpecialityModel {
   static async insertSpeciality(description) {
      try {
         const response = await pool.query(
            `
             INSERT INTO especialidad(descripcion)
             VALUES($1)
          `,
            [description],
         );
      } catch (err) {
         throw new DefaultError(
            'DatabaseError',
            'Error al crear la especialidad.',
            500,
         );
      }
   }
   static async getSpeciality(id_especialidad) {
      try {
         const speciality = await pool.query(
            `
             SELECT * 
             FROM especialidad 
             WHERE id_especialidad = $1
          `,
            [id_especialidad],
         );
         return speciality.rows[0];
      } catch (err) {
         throw new DefaultError(
            'DatabaseError',
            'Error al obtener la especialidad.',
            500,
         );
      }
   }
   static async getAllSpecialities() {
      try {
         const speciality = await pool.query(`
             SELECT * 
             FROM especialidad
          `);
         return speciality.rows;
      } catch (err) {
         throw new DefaultError(
            'DatabaseError',
            'Error al obtener la especialidad.',
            500,
         );
      }
   }
}
