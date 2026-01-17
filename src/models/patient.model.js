import { pool } from '../configs/config.js';
import { InternalServerError } from '../errors/errors.js';
import { createHashId } from '../utils/encrypt.js';
export class PatientModel {
  static async getPatient(hash_id) {
    try {
      const res = await pool.query(
        ` SELECT paciente.*,prestacion.nombre as prestacion, historia_clinica.hash_id as hash_id_EHR, ciudad.id_provincia as id_provincia
          FROM paciente
          INNER JOIN prestacion ON prestacion.id_prestacion = paciente.id_prestacion 
          INNER JOIN historia_clinica ON historia_clinica.dni_paciente = paciente.dni_paciente
          INNER JOIN ciudad ON ciudad.id_ciudad = paciente.id_ciudad
          WHERE paciente.hash_id = $1`,
        [hash_id],
      );
      return res.rows[0];
    } catch (e) {
      if (e instanceof InternalServerError) throw e;
      throw new InternalServerError('Error al consultar el paciente.');
    }
  }

  static async getPatientDni(hash_id) {
    try {
      const res = await pool.query(
        'SELECT dni_paciente FROM paciente WHERE hash_id = $1 AND inactivo = false',
        [hash_id],
      );
      return res.rows[0]?.dni_paciente;
    } catch (e) {
      if (e instanceof InternalServerError) throw e;
      throw new InternalServerError('Error al consultar el DNI del paciente.');
    }
  }

  static async getPatients() {
    try {
      const patients = await pool.query(
        `
          SELECT paciente.nombre, paciente.apellido, paciente.dni_paciente, prestacion.nombre as prestacion, paciente.hash_id
          FROM paciente
          INNER JOIN prestacion ON prestacion.id_prestacion = paciente.id_prestacion
          WHERE paciente.inactivo = false
        `,
      );
      return patients.rows;
    } catch (err) {
      throw new InternalServerError('Error al obtener los pacientes.');
    }
  }

  static async insertPatient({
    dni_paciente,
    nombre_paciente,
    apellido_paciente,
    fecha_nacimiento,
    id_ciudad,
    barrio_paciente,
    calle_paciente,
    telefono,
    id_prestacion,
    piso_departamento,
  }) {
    try {
      const patient = await pool.query(
        'SELECT * FROM paciente WHERE dni_paciente=$1',
        [dni_paciente],
      );
      if (patient.rows.length > 0) {
        if (patient.rows[0].inactivo) {
          await pool.query(
            'UPDATE paciente SET inactivo=false WHERE dni_paciente=$1',
            [dni_paciente],
          );
        }
        return;
      }

      const hash_id = createHashId(
        dni_paciente + nombre_paciente + apellido_paciente + fecha_nacimiento,
      );

      const res = await pool.query(
        'INSERT INTO paciente(dni_paciente, nombre, apellido, fecha_nacimiento, id_ciudad, barrio, calle, telefono, id_prestacion, piso_departamento, inactivo, hash_id) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)',
        [
          dni_paciente,
          nombre_paciente,
          apellido_paciente,
          fecha_nacimiento,
          id_ciudad,
          barrio_paciente,
          calle_paciente,
          telefono,
          id_prestacion,
          piso_departamento,
          false,
          hash_id,
        ],
      );
    } catch (err) {
      throw new InternalServerError('Error al crear el paciente.');
    }
  }

  static async deletePatient(dni_paciente) {
    try {
      const response = await pool.query(
        'UPDATE paciente SET inactivo=true WHERE dni_paciente=$1',
        [dni_paciente],
      );
    } catch (err) {
      throw new InternalServerError('Error al eliminar el paciente.');
    }
  }

  static async updatePatient({
    dni_paciente,
    nombre_paciente,
    apellido_paciente,
    fecha_nacimiento,
    id_ciudad,
    barrio_paciente,
    calle_paciente,
    telefono,
    id_prestacion,
    piso_departamento,
    dni_paciente_viejo,
  }) {
    try {
      const response = await pool.query(
        'UPDATE paciente SET dni_paciente=$1, nombre=$2, apellido=$3, fecha_nacimiento=$4, id_ciudad=$5, barrio=$6, calle=$7, telefono=$8, id_prestacion=$9, piso_departamento=$10 WHERE dni_paciente=$11',
        [
          dni_paciente,
          nombre_paciente,
          apellido_paciente,
          fecha_nacimiento,
          id_ciudad,
          barrio_paciente,
          calle_paciente,
          telefono,
          id_prestacion,
          piso_departamento,
          dni_paciente_viejo,
        ],
      );
    } catch (err) {
      throw new InternalServerError('Error al actualizar el paciente.');
    }
  }
}
