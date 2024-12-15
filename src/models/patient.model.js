import { pool } from '../configs/config.js';
import { DefaultError } from '../errors/errors.js';

export class PatientModel {
   static async getPatient() {
      try {
         const res = await pool.query('SELECT * FROM paciente');
         if (!res || res.rowCount === 0) {
            throw new DefaultError(
               'NotFoundError',
               'No se encontraron pacientes',
               404,
            );
         }
         console.log(res);
         return res.rows;
      } catch (e) {
         if (e instanceof DefaultError) throw e;
         throw new DefaultError(
            'DatabaseError',
            'Error al consultar el paciente',
            500,
         );
      }
   }

   static async insertPatient({
      dni_paciente,
      nombre_paciente,
      apellido_paciente,
      fecha_nacimiento,
      id_codigo_postal,
      id_barrio,
      id_calle,
      numero_calle,
      telefono,
   }) {
      try {
         const res = await pool.query(
            'INSERT INTO paciente(dni_paciente, nombre_paciente, apellido_paciente, fecha_nacimiento, id_codigo_postal, id_barrio, id_calle, numero_calle, telefono) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9)',
            [
               dni_paciente,
               nombre_paciente,
               apellido_paciente,
               fecha_nacimiento,
               id_codigo_postal,
               id_barrio,
               id_calle,
               numero_calle,
               telefono,
            ],
         );
      } catch (err) {
         throw new DefaultError(
            'DatabaseError',
            'Error al consultar el paciente',
            500,
         );
      }
   }
}
