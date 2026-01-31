import { pool } from '../configs/config.js';
import { InternalServerError, NotFoundError } from '../errors/errors.js';

export class EHRModel {
  static async createEHR(dni_paciente, hashId) {
    //  Tambien faltaria agregar quien crea la EHR
    try {
      const { rows } = await pool.query(
        `
        INSERT INTO historia_clinica (dni_paciente, hash_id) VALUES ($1, $2) RETURNING *
        `,
        [dni_paciente, hashId],
      );
      return rows[0];
    } catch (err) {
      throw new InternalServerError('Error al crear EHR.');
    }
  }
  static async updateModificationDate(hashId) {
    try {
      const { rows } = await pool.query(
        `UPDATE historia_clinica SET fecha_modificacion = $1 WHERE hash_id = $2`,
        [new Date(), hashId],
      );
    } catch (err) {
      throw new InternalServerError(
        'Error al actualizar fecha de modificación.',
      );
    }
  }
  static async getEHRByDNI(dni) {
    const query = 'SELECT * FROM historia_clinica WHERE dni_paciente = $1';
    const values = [dni];
    try {
      const { rows } = await pool.query(query, values);
      return rows[0];
    } catch (err) {
      throw new InternalServerError('Error al obtener EHR');
    }
  }
  static async getEHRByIdHistoriaClinica(id_historia_clinica) {
    const query =
      'SELECT * FROM historia_clinica WHERE id_historia_clinica = $1';
    const values = [id_historia_clinica];
    try {
      const { rows } = await pool.query(query, values);
      return rows[0] ?? null;
    } catch (err) {
      throw new InternalServerError('Error al obtener EHR');
    }
  }
  static async getEHR(hashId) {
    //! Temgo que obtener la historia completa, la fisiatrica y los informes
    //! Ver tabla informes, capaz necesito utilizar el id_historia_clinica

    try {
      const response = await pool.query(
        'SELECT * FROM historia_clinica WHERE hash_id = $1',
        [hashId],
      );
      if (response.rows.length === 0) {
        throw new NotFoundError('Historia clinica no encontrada.');
      }
      return response.rows[0];
    } catch (err) {
      throw new InternalServerError('Error al obtener EHR.');
    }
  }
  static async createHCFisiatric(ehrId, hcFisiatric) {
    const {
      evaluacionConsulta,
      antecedentes,
      anamnesisSistemica,
      examenFisico,
      diagnosticoFuncional,
    } = hcFisiatric;

    const query =
      'INSERT INTO hc_fisiatrica (id_historia_clinica, evaluacion_consulta, antecedentes, anamnesis_sistemica, examen_fisico, diagnostico_funcional) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *';
    const values = [
      ehrId,
      JSON.stringify(evaluacionConsulta),
      JSON.stringify(antecedentes),
      JSON.stringify(anamnesisSistemica),
      JSON.stringify(examenFisico),
      JSON.stringify(diagnosticoFuncional),
    ];
    try {
      const { rows } = await pool.query(query, values);
      return rows[0];
    } catch (err) {
      throw new InternalServerError('Error al crear HC Fisiatrica.');
    }
  }
  static async getHCFisiatric(ehrId) {
    try {
      const { rows } = await pool.query(
        'SELECT * FROM hc_fisiatrica WHERE id_historia_clinica = $1',
        [ehrId],
      );
      return rows[0];
    } catch (err) {
      throw new InternalServerError('Error al obtener HC Fisiatrica.');
    }
  }
}
