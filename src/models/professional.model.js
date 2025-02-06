import { pool } from '../configs/config';
import { DefaultError } from '../errors/errors';

export class ProfessionalModel {
   //* Professional
   static async insertProfessional(id_usuario, especialidades) {
      //Especialidades = []
      try {
         const responseProfessional = await pool.query(
            ` INSERT INTO profesional(id_usuario) VALUES($1) RETURNING *`,
            [id_usuario],
         );

         especialidades.map(async (especialidad) => {
            const { id_especialidad, matricula } = especialidad; // ! VER SI POR CADA ESPECIALIDAD EXISTE UNA MATRICULA
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
   //! Ver si hace falta refactorizar
   static async getProfessional(id_profesional) {
      try {
         const professional = await pool.query(
            `
               SELECT * 
               FROM profesional
               WHERE id_profesional = $1
            `,
            [id_profesional],
         );

         const specialities = await pool.query(
            `
               SELECT * 
               FROM especialidad_profesional 
               WHERE id_profesional = $1
            `,
            [id_profesional],
         );

         const specialitiesPromise = specialities.rows.map(
            async (speciality) => {
               const response = await pool.query(
                  `
                  SELECT *
                  FROM especialidad
                  WHERE id_especialidad = $1
               `,
                  [speciality.id_especialidad],
               );

               return response.rows[0];
            },
         );
         const specialityComplete = Promise.all(specialitiesPromise);

         const user = await pool.query(
            `
               SELECT * 
               FROM usuario
               WHERE id_usuario = $1
            `,
            [professional.rows[0].id_usuario],
         );

         return {
            user: user.rows[0],
            id_profesional,
            specialities: specialityComplete,
         };
      } catch (err) {
         throw new DefaultError(
            'DatabaseError',
            'Error al obtener el profesional.',
            500,
         );
      }
   }
   //! Ver si hace falta refactorizar
   static async getAllProfessionals() {
      try {
         const professionals = await pool.query(`
               SELECT * 
               FROM profesional
            `);

         const professionalsPromise = professionals.rows.map(
            async (professional) => {
               const user = await pool.query(
                  `
                     SELECT * 
                     FROM usuario
                     WHERE id_profesional = $1
                  `,
                  [professional.id_usuario],
               );
               const specialities = await pool.query(
                  `
                     SELECT * 
                     FROM profesional_especialidad 
                     WHERE id_profesional = $1
                  `,
                  [professional.id_profesional],
               );
               const specialitiesPromise = specialities.rows.map(
                  async (speciality) => {
                     const response = await pool.query(
                        `
                        SELECT * 
                        FROM especialidad
                        WHERE id_especialidad = $1
                     `,
                        [speciality.id_especialidad],
                     );
                     return response.rows[0];
                  },
               );
               const specialitiesComplete = Promise.all(specialitiesPromise);

               return {
                  user: user.rows[0],
                  specialities: specialitiesComplete,
                  id_profesional: professional.id_profesional,
               };
            },
         );

         const professionalsComplete = Promise.all(professionalsPromise);

         return professionalsComplete;
      } catch (err) {
         throw new DefaultError(
            'DatabaseError',
            'Error al obtener los profesionales.',
            500,
         );
      }
   }
   //* Speciality
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
