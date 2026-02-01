import { pool } from '../configs/config.js';
import { InternalServerError } from '../errors/errors.js';

export class AuthModel {
  static async login(email) {
    try {
      const user = await pool.query(
        `
          SELECT id_usuario, email, id_tipo_usuario, nombre, apellido, hash_id
          FROM usuario 
          WHERE email=$1 AND inactivo = false AND expired_at > NOW()
       `,
        [email],
      );
      return user.rows[0];
    } catch (err) {
      throw new InternalServerError('Error al consultar el usuario.');
    }
  }
}
