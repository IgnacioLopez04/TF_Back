import { DefaulError } from '../errors/errors.js';

export class AuthModel {
   static async login(email, password) {
      try {
         const user = await pool.query(
            `
         SELECT id_usuario, email, id_tipo_usuario, nombre_usuario, apellido_usuario 
         FROM usuario 
         WHERE email=$1 AND password=$2
       `,
            [email, password],
         );
         return user.rows[0];
      } catch (err) {
         throw new DefaulError(
            'DatabaseError',
            'Error al consultar el usuario.',
            500,
         );
      }
   }
}
