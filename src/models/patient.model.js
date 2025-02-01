import { pool } from '../configs/config.js';
import { DefaultError } from '../errors/errors.js';

export class PatientModel {
   static async getPatient() {
      try {
         const res = await pool.query('SELECT * FROM paciente');
         if (!res || res.rowCount === 0) {
            throw new DefaultError(
               'NotFoundError',
               'No se encontraron pacientes.',
               404,
            );
         }
         return res.rows;
      } catch (e) {
         if (e instanceof DefaultError) throw e;
         throw new DefaultError(
            'DatabaseError',
            'Error al consultar el paciente.',
            500,
         );
      }
   }

   // TODO calle y numero de la calle
   static async insertPatient({
      dni_paciente,
      nombre_paciente,
      apellido_paciente,
      fecha_nacimiento,
      id_codigo_postal,
      id_barrio,
      telefono,
   }) {
      try {
         const res = await pool.query(
            'INSERT INTO paciente(dni_paciente, nombre_paciente, apellido_paciente, fecha_nacimiento, id_codigo_postal, id_barrio, telefono) VALUES($1, $2, $3, $4, $5, $6, $7)',
            [
               dni_paciente,
               nombre_paciente,
               apellido_paciente,
               fecha_nacimiento,
               id_codigo_postal,
               id_barrio,
               telefono,
            ],
         );
      } catch (err) {
         throw new DefaultError(
            'DatabaseError',
            'Error al consultar el paciente.',
            500,
         );
      }
   }

   static async deletePatient(dni_paciente) {
      try {
         const response = await pool.query(
            'UPDATE paciente SET inactivo=true WHERE dni_paciente=$1',
            [dni_paciente],
         );
      } catch (err) {
         throw new DefaultError(
            'DatabaseError',
            'Error al eliminar el paciente.',
            500,
         );
      }
   }
}
