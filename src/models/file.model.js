import { pool } from '../configs/config';
import { DefaultError } from '../errors/errors';

export class FileModel {
   static async insertFile(dni_paciente, nombre_estudio, descripcion, path) {
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
   static async insertImage(id_paciente, path) {
      try {
         await pool.query(
            `
                INSERT INTO imagen(id_paciente, path)
                VALUES($1, $2)
            `,
            [id_paciente, path],
         );
      } catch (err) {
         throw new DefaultError(
            'DatabaseError',
            'Error al cargar la imagen.',
            500,
         );
      }
   }
   static async insertAudio(id_paciente, path) {
      try {
         await pool.query(
            `
                INSERT INTO audio(id_paciente, path)
                VALUES($1,$2)
            `,
            [id_paciente, path],
         );
      } catch (err) {
         throw new DefaultError(
            'DatabaseError',
            'Error al cargar el audio.',
            500,
         );
      }
   }
   static async insertVideo(id_paciente, path) {
      try {
         await pool.query(
            `
                INSERT INTO video(id_paciente, path)
                VALUES($1,$2)
            `,
            [id_paciente, path],
         );
      } catch (err) {
         throw new DefaultError(
            'DatabaseError',
            'Error al cargar el video.',
            500,
         );
      }
   }
   static async deleteImagen(id_paciente, id_imagen) {
      try {
         await pool.query(
            `DELETE FROM imagen WHERE id_imagen=$1 AND id_paciente=$2`,
            [id_imagen, id_paciente],
         );
      } catch (err) {
         throw new DefaultError(
            'DatabaseError',
            'Error al eliminar la imagen.',
            500,
         );
      }
   }
   static async deleteAudio(id_paciente, id_audio) {
      try {
         await pool.query(
            `DELETE FROM audio WHERE id_audio=$1 AND id_paciente=$2`,
            [id_audio, id_paciente],
         );
      } catch (err) {
         throw new DefaultError(
            'DatabaseError',
            'Error al eliminar la imagen.',
            500,
         );
      }
   }
   static async deleteVideo(id_paciente, id_video) {
      try {
         await pool.query(
            `DELETE FROM video WHERE id_video=$1 AND id_paciente=$2`,
            [id_video, id_paciente],
         );
      } catch (err) {
         throw new DefaultError(
            'DatabaseError',
            'Error al eliminar la imagen.',
            500,
         );
      }
   }
   static async getFile(id_estudio, id_paciente) {
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
   static async getImage(id_imagen, id_paciente) {
      try {
         const image = await pool.query(
            'SELECT * FROM imagen WHERE id_imagen= $1 AND id_paciente=$2',
            [id_imagen, id_paciente],
         );
         return image.rows[0];
      } catch (err) {
         throw new DefaultError(
            'DatabaseError',
            'Error al obtener la imagen.',
            500,
         );
      }
   }
   static async getVideo(id_video, id_paciente) {
      try {
         const video = await pool.query(
            'SELECT * FROM video WHERE id_video= $1 AND id_paciente=$2',
            [id_video, id_paciente],
         );
         return video.rows[0];
      } catch (err) {
         throw new DefaultError(
            'DatabaseError',
            'Error al obtener el video.',
            500,
         );
      }
   }
   static async getAudio(id_audio, id_paciente) {
      try {
         const audio = await pool.query(
            'SELECT * FROM audio WHERE id_audio= $1 AND id_paciente=$2',
            [id_audio, id_paciente],
         );
         return audio.rows[0];
      } catch (err) {
         throw new DefaultError(
            'DatabaseError',
            'Error al obtener el audio.',
            500,
         );
      }
   }
   static async getFiles(id_paciente) {
      try {
         const files = await pool.query(
            'SELECT * FROM estudio_medico WHERE id_paciente = $1',
            [id_paciente],
         );
         const images = await pool.query(
            'SELECT * FROM imagen WHERE id_paciente = $1',
            [id_paciente],
         );
         const videos = await pool.query(
            'SELECT * FROM video WHERE id_paciente = $1',
            [id_paciente],
         );
         const audios = await pool.query(
            'SELECT * FROM audio WHERE id_paciente = $1',
            [id_paciente],
         );

         return {
            files: files.rows,
            images: files.rows,
            videos: files.rows,
            audios: files.rows,
         };
      } catch (err) {
         throw new DefaultError(
            'DatabaseError',
            'Error al obtener los archivos.',
            500,
         );
      }
   }
}
