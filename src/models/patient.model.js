import { pool } from '../configs/config.js';
import { DefaultError } from '../errors/errors.js';

export class PatientModel {
   static async getPatient(dni_paciente) {
      try {
         const res = await pool.query(
            'SELECT * FROM paciente WHERE dni_paciente = $1',
            [dni_paciente],
         );
         return res.rows[0];
      } catch (e) {
         if (e instanceof DefaultError) throw e;
         throw new DefaultError(
            'DatabaseError',
            'Error al consultar el paciente.',
            500,
         );
      }
   }

   static async getPatients() {
      try {
         const patients = await pool.query('SELECT * FROM paciente');
         return patients.rows;
      } catch (err) {
         throw new DefaultError(
            'DatabaseError',
            'Error al obtener los pacientes.',
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
         const patient = await pool.query(
            'SELECT * FROM paciente WHERE dni_paciente=$1',
            [dni_paciente],
         );
         if (patient.rows.length > 0) {
            if (!patient.rows.inactivo) {
               await pool.query(
                  'UPDATE paciente SET inactivo=false WHERE dni_paciente=$1',
                  [dni_paciente],
               );
            }
            return res.rows[0];
         }

         const res = await pool.query(
            'INSERT INTO paciente(dni_paciente, nombre, apellido, fecha_nacimiento, id_codigo_postal, id_barrio, telefono) VALUES($1, $2, $3, $4, $5, $6, $7)',
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
            'Error al crear el paciente.',
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
   static async updatePatient({
      dni_paciente,
      nombre_paciente,
      apellido_paciente,
      fecha_nacimiento,
      id_codigo_postal,
      id_barrio,
      telefono,
      dni_paciente_viejo,
   }) {
      try {
         const response = await pool.query(
            'UPDATE paciente SET dni_paciente=$1, nombre=$2, apellido=$3, fecha_nacimiento=$4, id_codigo_postal=$5, id_barrio=$6, telefono=$7 WHERE dni_paciente=$8',
            [
               dni_paciente,
               nombre_paciente,
               apellido_paciente,
               fecha_nacimiento,
               id_codigo_postal,
               id_barrio,
               telefono,
               dni_paciente_viejo,
            ],
         );
      } catch (err) {
         throw new DefaultError(
            'DatabaseError',
            'Error al actualizar el paciente.',
            500,
         );
      }
   }
}
