import { pool } from '../configs/config';
import { InternalServerError } from '../errors/errors';

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
      throw new InternalServerError('Error al crear la especialidad.');
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
      throw new InternalServerError('Error al obtener la especialidad.');
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
      throw new InternalServerError('Error al obtener la especialidad.');
    }
  }
}
