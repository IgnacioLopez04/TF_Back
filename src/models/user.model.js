import { pool } from '../configs/config.js';
import { InternalServerError, BadRequestError } from '../errors/errors.js';

export class UserModel {
  static async insertUser({
    email,
    dni_usuario,
    nombre_usuario,
    apellido_usuario,
    fecha_nacimiento,
    id_tipo_usuario,
    hash_id,
  }) {
    try {
      const response = await pool.query(
        ` INSERT INTO usuario(email, dni_usuario, nombre, apellido, fecha_nacimiento, id_tipo_usuario, hash_id) 
              VALUES($1, $2, $3, $4, $5, $6,$7)
            `,
        [
          email,
          dni_usuario,
          nombre_usuario,
          apellido_usuario,
          fecha_nacimiento,
          id_tipo_usuario,
          hash_id,
        ],
      );
    } catch (err) {
      if (err.code === '23505') {
        throw new BadRequestError('Usuario ya existe.');
      }
      throw new InternalServerError('Error al crear el usuario.');
    }
  }
  static async getUser(dni_usuario) {
    try {
      const response = await pool.query(
        `
              SELECT * 
              FROM usuario
              WHERE dni_usuario=$1
            `,
        [dni_usuario],
      );
      return response.rows[0];
    } catch (err) {
      throw new InternalServerError('Error al obtener el usuario.');
    }
  }
  static async getUsers() {
    try {
      const response = await pool.query(
        `
          SELECT hash_id, email, dni_usuario, nombre, apellido, fecha_nacimiento, id_tipo_usuario, inactivo, expired_at
          FROM usuario
      `,
      );
      return response.rows;
    } catch (err) {
      throw new InternalServerError('Error al obtener los usuarios.');
    }
  }
  static async getActiveUsers() {
    try {
      const response = await pool.query(
        `
          SELECT * 
          FROM usuario
          WHERE inactivo = false
      `,
      );
      return response.rows;
    } catch (err) {
      throw new InternalServerError('Error al obtener los usuarios.');
    }
  }
  static async updateExpiredAt(hash_id) {
    try {
      await pool.query(
        `
          UPDATE usuario
          SET expired_at = NOW() + INTERVAL '180 days'
          WHERE hash_id = $1
      `,
        [hash_id],
      );
    } catch (err) {
      throw new InternalServerError(
        'Error al actualizar la fecha de expiracion del usuario.',
      );
    }
  }
  static async blockUser(hash_id) {
    try {
      await pool.query(
        `
               UPDATE usuario
               SET inactivo = true
               WHERE hash_id = $1
            `,
        [hash_id],
      );
    } catch (err) {
      throw new InternalServerError('Error al bloquear el usuario.');
    }
  }
  static async activateUser(hash_id) {
    /**
     * Se activa el usuario y se le da una fecha de expiracion de 7 dias, para que el usuario pueda volver a logearse.
     * Si el usuario no se logea en 7 dias, se le bloquea la cuenta.
     */
    try {
      await pool.query(
        `
               UPDATE usuario
               SET inactivo = false, expired_at = NOW() + INTERVAL '7 day'
               WHERE hash_id = $1
            `,
        [hash_id],
      );
    } catch (err) {
      throw new InternalServerError('Error al activar el usuario.');
    }
  }
}
