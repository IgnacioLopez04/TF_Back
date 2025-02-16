import { pool } from '../configs/config';
import { DefaultError } from '../errors/errors';

export class professionalModel {
   static async insertProfessional({ id_usuario, especialidades }) {
      //* Especialidades = []
      try {
         const responseProfessional = await pool.query(
            ` INSERT INTO profesional(id_usuario) VALUES($1) RETURNING *`,
            [id_usuario],
         );

         especialidades.map(async (especialidad) => {
            const { id_especialidad, matricula } = especialidad; //! VER SI POR CADA ESPECIALIDAD EXISTE UNA MATRICULA
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
   static async getProfessional(id_usuario) {
      try {
         const professionalResponse = await pool.query(
            'SELECT * FROM get_professioal_and_specialities($1)',
            [id_usuario],
         );
         const professional = professionalResponse.rows;

         // TODO: ver que devuelve este llamado para poder buscar los nombre de las especialidades y las matriculas a las mismas.
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
