import { pool } from '../configs/config.js';
import { DefaultError } from '../errors/errors.js';

export class UserModel {
   static async insertUser({
      email,
      dni_usuario,
      nombre_usuario,
      apellido_usuario,
      fecha_nacimiento,
      id_tipo_usuario,
   }) {
      try {
         const response = await pool.query(
            ` INSERT INTO usuario(email, dni_usuario, nombre, apellido, fecha_nacimiento, id_tipo_usuario) 
              VALUES($1, $2, $3, $4, $5, $6,$7)
            `,
            [
               email,
               dni_usuario,
               nombre_usuario,
               apellido_usuario,
               fecha_nacimiento,
               id_tipo_usuario,
            ],
         );
      } catch (err) {
         throw new DefaultError(
            'DatabaseError',
            'Error al crear el usuario.',
            500,
         );
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
         throw new DefaultError(
            'DatabaseError',
            'Error al obtener el usuario.',
            500,
         );
      }
   }
   static async getUsers() {
      try {
         const response = await pool.query(
            `
               SELECT * 
               FROM usuario
            `,
         );
         return response.rows;
      } catch (err) {
         throw new DefaultError(
            'DatabaseError',
            'Error al obtener los usuarios.',
            500,
         );
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
         throw new DefaultError(
            'DatabaseError',
            'Error al obtener los usuarios.',
            500,
         );
      }
   }
   static async updateExpiredAt(dni_usuario) {
      try {
         await pool.query(
            `
               UPDATE usuario
               SET expired_at = NOW() + INTERVAL '180 days'
               WHERE dni_usuario = $1
            `,
            [dni_usuario],
         );
      } catch (err) {
         throw new DefaultError(
            'DatabaseError',
            'Error al actualizar la fecha de expiracion del usuario.',
            500,
         );
      }
   }
   static async blockUser(dni_usuario) {
      try {
         await pool.query(
            `
               UPDATE usuario
               SET inactivo = true
               WHERE dni_usuario = $1
            `,
            [dni_usuario],
         );
      } catch (err) {
         throw new DefaultError(
            'DatabaseError',
            'Error al bloquear el usuario.',
            500,
         );
      }
   }
   static async activateUser(dni_usuario) {
      /**
       * Se activa el usuario y se le da una fecha de expiracion de 7 dias, para que el usuario pueda volver a logearse.
       * Si el usuario no se logea en 7 dias, se le bloquea la cuenta.
       */
      try {
         await pool.query(
            `
               UPDATE usuario
               SET inactivo = false, expired_at = NOW() + INTERVAL '7 day'
               WHERE dni_usuario = $1
            `,
            [dni_usuario],
         );
      } catch (err) {
         throw new DefaultError(
            'DatabaseError',
            'Error al activar el usuario.',
            500,
         );
      }
   }
}
