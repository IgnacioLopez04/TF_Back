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
      fileKey,
   ) {
      try {
         const file = await pool.query(
            `INSERT INTO documento (dni_paciente, id_usuario, path, nombre, tipo_archivo, key) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id_documento`,
            [dni_paciente, id_usuario, path, nombre, tipo_archivo, fileKey],
         );
         return file.rows[0].id_documento;
      } catch (err) {
         throw new DefaultError(
            'DataBaseError',
            'Error al insertar los documentos.',
            500,
         );
      }
   }
   static async getFiles(dni_paciente, tipo_archivo) {
      try {
         const files = await pool.query(
            `SELECT * FROM documento WHERE dni_paciente=$1 AND tipo_archivo=$2`,
            [dni_paciente, tipo_archivo],
         );
         return files.rows;
      } catch (err) {
         throw new DefaultError(
            'DefaultBaseError',
            'Error al recuperar los documentos.',
            500,
         );
      }
   }
}
