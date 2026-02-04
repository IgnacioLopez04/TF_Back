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

    const query = `INSERT INTO hc_fisiatrica (
      id_historia_clinica, version_number, effective_from, effective_to, is_current,
      evaluacion_consulta, antecedentes, anamnesis_sistemica, examen_fisico, diagnostico_funcional
    ) VALUES ($1, 1, CURRENT_TIMESTAMP, NULL, TRUE, $2, $3, $4, $5, $6) RETURNING *`;
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
        'SELECT * FROM hc_fisiatrica WHERE id_historia_clinica = $1 AND is_current = TRUE',
        [ehrId],
      );
      return rows[0];
    } catch (err) {
      throw new InternalServerError('Error al obtener HC Fisiatrica.');
    }
  }

  static async getHCFisiatricHistory(ehrId) {
    try {
      const { rows } = await pool.query(
        'SELECT * FROM hc_fisiatrica WHERE id_historia_clinica = $1 ORDER BY version_number DESC',
        [ehrId],
      );
      return rows;
    } catch (err) {
      throw new InternalServerError('Error al obtener historial HC Fisiatrica.');
    }
  }

  static async createNewVersionHCFisiatric(ehrId, hcFisiatric) {
    const current = await this.getHCFisiatric(ehrId);
    if (!current) {
      return this.createHCFisiatric(ehrId, hcFisiatric);
    }

    const merge = (currentRow, payload) => ({
      evaluacionConsulta:
        payload.evaluacionConsulta ?? currentRow.evaluacion_consulta,
      antecedentes: payload.antecedentes ?? currentRow.antecedentes,
      anamnesisSistemica:
        payload.anamnesisSistemica ?? currentRow.anamnesis_sistemica,
      examenFisico: payload.examenFisico ?? currentRow.examen_fisico,
      diagnosticoFuncional:
        payload.diagnosticoFuncional ?? currentRow.diagnostico_funcional,
    });

    const merged = merge(current, hcFisiatric || {});
    const nextVersion = current.version_number + 1;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        `UPDATE hc_fisiatrica SET is_current = FALSE, effective_to = CURRENT_TIMESTAMP
         WHERE id_historia_clinica = $1 AND is_current = TRUE`,
        [ehrId],
      );
      const insertQuery = `INSERT INTO hc_fisiatrica (
        id_historia_clinica, version_number, effective_from, effective_to, is_current,
        evaluacion_consulta, antecedentes, anamnesis_sistemica, examen_fisico, diagnostico_funcional
      ) VALUES ($1, $2, CURRENT_TIMESTAMP, NULL, TRUE, $3, $4, $5, $6, $7) RETURNING *`;
      const insertValues = [
        ehrId,
        nextVersion,
        JSON.stringify(merged.evaluacionConsulta),
        JSON.stringify(merged.antecedentes),
        JSON.stringify(merged.anamnesisSistemica),
        JSON.stringify(merged.examenFisico),
        JSON.stringify(merged.diagnosticoFuncional),
      ];
      const { rows } = await client.query(insertQuery, insertValues);
      await client.query('COMMIT');
      return rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw new InternalServerError('Error al crear nueva versión HC Fisiatrica.');
    } finally {
      client.release();
    }
  }
}
