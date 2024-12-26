import { pool } from '../configs/config.js';
import { DefaultError } from '../errors/errors.js';

export class userModel {
   static async insertUser({
      contrasenia,
      email,
      dni_usuario,
      nombre_usuario,
      apellido_usuario,
      fecha_nacimiento,
      id_tipo_usuario,
   }) {
      try {
         const response = await pool.query(
            ` INSERT INTO usuario(contrasenia, email, dni_usuario, nombre_usuario, apellido_usuario, fecha_nacimiento, id_tipo_usuario) 
              VALUES($1, $2, $3, $4, $5, $6,$7)
            `,
            [
               contrasenia,
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
   static async deleteUser(dni_usuario) {
      try {
         const response = await pool.query(
            `
              UPDATE usuario
              SET inactivo=true
              WHERE dni_usuario=$1
            `,
            [dni_usuario],
         );
      } catch (err) {
         throw new DefaultError(
            'DatabaseError',
            'Error al eliminar el usuario.',
            500,
         );
      }
   }
}
