import { pool } from '../configs/config.js';
import { InternalServerError } from '../errors/errors.js';
import { createHashId } from '../utils/encrypt.js';
export class PatientModel {
  static async getPatient(hash_id) {
    try {
      console.log(hash_id);
      const res = await pool.query(
        ` SELECT paciente.*,prestacion.nombre as prestacion, historia_clinica.hash_id as hash_id_EHR, ciudad.id_provincia as id_provincia
          FROM paciente
          INNER JOIN prestacion ON prestacion.id_prestacion = paciente.id_prestacion 
          INNER JOIN historia_clinica ON historia_clinica.dni_paciente = paciente.dni_paciente
          INNER JOIN ciudad ON ciudad.id_ciudad = paciente.id_ciudad
          WHERE paciente.hash_id = $1`,
        [hash_id],
      );
      console.log(res.rows[0]);
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

  static async getPatients(includeInactive = false) {
    try {
      let query = `
          SELECT paciente.nombre, paciente.apellido, paciente.dni_paciente, prestacion.nombre as prestacion, paciente.hash_id,
            paciente.ocupacion_actual, paciente.ocupacion_anterior, paciente.inactivo,
            (SELECT id_mutual FROM dato_mutual WHERE dato_mutual.dni_paciente = paciente.dni_paciente ORDER BY id_datos_mutual LIMIT 1) AS id_mutual,
            (SELECT numero_afiliado FROM dato_mutual WHERE dato_mutual.dni_paciente = paciente.dni_paciente ORDER BY id_datos_mutual LIMIT 1) AS numero_afiliado
          FROM paciente
          INNER JOIN prestacion ON prestacion.id_prestacion = paciente.id_prestacion
      `;

      if (!includeInactive) {
        query += ` WHERE paciente.inactivo = false`;
      }

      const patients = await pool.query(query);
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
    numero_calle,
    telefono,
    id_prestacion,
    piso_departamento,
    vive_con,
    ocupacion_actual,
    ocupacion_anterior,
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
        return { inserted: false };
      }

      const hash_id = createHashId(
        dni_paciente + nombre_paciente + apellido_paciente + fecha_nacimiento,
      );

      await pool.query(
        'INSERT INTO paciente(dni_paciente, nombre, apellido, fecha_nacimiento, id_ciudad, barrio, calle, numero_calle, telefono, id_prestacion, piso_departamento, inactivo, hash_id, vive_con, ocupacion_actual, ocupacion_anterior) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)',
        [
          dni_paciente,
          nombre_paciente,
          apellido_paciente,
          fecha_nacimiento,
          id_ciudad,
          barrio_paciente,
          calle_paciente,
          numero_calle,
          telefono,
          id_prestacion,
          piso_departamento,
          false,
          hash_id,
          vive_con,
          ocupacion_actual ?? null,
          ocupacion_anterior ?? null,
        ],
      );
      return { inserted: true };
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
    numero_calle,
    telefono,
    id_prestacion,
    piso_departamento,
    ocupacion_actual,
    ocupacion_anterior,
    dni_paciente_viejo,
  }) {
    try {
      await pool.query(
        'UPDATE paciente SET dni_paciente=$1, nombre=$2, apellido=$3, fecha_nacimiento=$4, id_ciudad=$5, barrio=$6, calle=$7, numero_calle=$8, telefono=$9, id_prestacion=$10, piso_departamento=$11, ocupacion_actual=$12, ocupacion_anterior=$13 WHERE dni_paciente=$14',
        [
          dni_paciente,
          nombre_paciente,
          apellido_paciente,
          fecha_nacimiento,
          id_ciudad,
          barrio_paciente,
          calle_paciente,
          numero_calle,
          telefono,
          id_prestacion,
          piso_departamento,
          ocupacion_actual ?? null,
          ocupacion_anterior ?? null,
          dni_paciente_viejo,
        ],
      );
    } catch (err) {
      throw new InternalServerError('Error al actualizar el paciente.');
    }
  }
}
