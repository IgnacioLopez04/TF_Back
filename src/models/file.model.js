import { pool } from '../configs/config.js';
import { DefaultError } from '../errors/errors.js';

export class FileModel {
   static async insertMedicalFile(
      dni_paciente,
      nombre_estudio,
      descripcion,
      path,
   ) {
      try {
         await pool.query(
            `
                INSERT INTO estudio_medico(dni_paciente, nombre_estudio, descripcion, path)
                VALUES($1, $2, $3, $4)    
            `,
            [dni_paciente, nombre_estudio, descripcion, path],
         );
      } catch (err) {
         throw new DefaultError(
            'DatabaseError',
            'Error al cargar los estudios.',
            500,
         );
      }
   }
   static async getMedicalFile(id_estudio, id_paciente) {
      try {
         const file = await pool.query(
            'SELECT * FROM estudio_medico WHERE id_estudio= $1 AND id_paciente=$2',
            [id_estudio, id_paciente],
         );
         return file.rows[0];
      } catch (err) {
         throw new DefaultError(
            'DatabaseError',
            'Error al obtener el estudio.',
            500,
         );
      }
   }
   static async insertFile(
      dni_paciente,
      id_usuario,
      path,
      nombre,
      tipo_archivo,
   ) {
      try {
         await pool.query(
            `INSERT INTO documento (dni_paciente, id_usuario, path, nombre, tipo_archivo) VALUES ($1, $2, $3, $4, $5)`,
            [dni_paciente, id_usuario, path, nombre, tipo_archivo],
         );
      } catch (err) {
         console.log(err);
         throw new DefaultError(
            'DataBaseError',
            'Error al insertar los documentos.',
            500,
         );
      }
   }
}
