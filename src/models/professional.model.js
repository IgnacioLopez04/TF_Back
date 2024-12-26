import { pool } from '../configs/config';
import { DefaultError } from '../errors/errors';

export class professionalModel {
   static async insertProfessional({ id_usuario, especialidades }) {
      //Especialidades = []
      try {
         const responseProfessional = await pool.query(
            ` INSERT INTO profesional(id_usuario) VALUES($1) RETURNING *`,
            [id_usuario],
         );

         especialidades.map(async (especialidad) => {
            const { id_especialidad, matricula } = especialidad; // VER SI POR CADA ESPECIALIDAD EXISTE UNA MATRICULA
            const response = await pool.query(
               `INSERT INTO profesional_especialidad(id_especialidad, id_profesional, matricula) VALUES($1, $2, $3)`,
               [responseProfessional, id_especialidad, matricula],
            );
         });
      } catch (err) {
         throw new DefaultError(
            'DatabaseError',
            'Error al crear el profesional.',
            500,
         );
      }
   }
   static async getProfessional() {
      try {
      } catch (err) {
         throw new DefaultError(
            'DatabaseError',
            'Error al obtener el profesional.',
            500,
         );
      }
   }
   static async getAllProfessionals() {
      try {
      } catch (err) {
         throw new DefaultError(
            'DatabaseError',
            'Error al obtener los profesionales.',
            500,
         );
      }
   }
   static async insertSpeciality() {
      try {
      } catch (err) {
         throw new DefaultError(
            'DatabaseError',
            'Error al crear la especialidad.',
            500,
         );
      }
   }
   static async getSpeciality() {
      try {
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
      } catch (err) {
         throw new DefaultError(
            'DatabaseError',
            'Error al obtener la especialidad.',
            500,
         );
      }
   }
}
