import { pool } from '../configs/config';
import { DefaultError } from '../errors/errors';

export class EHRModel {
  static async getEHRId(ehrId) {
    const query =
      'SELECT id_historia_clinica FROM historia_clinico WHERE id_historia_clinica = $1';
    const values = [ehrId];
    try {
      const { rows } = await pool.query(query, values);
      return rows[0];
    } catch (err) {
      throw new DefaultError('DatabaseError', 'Error al obtener EHR', 500);
    }
  }
  static async getEHR(ehrId) {
    //! Temgo que obtener la historia completa, la fisiatrica y los informes
    //! Ver tabla informes, capaz necesito utilizar el id_historia_clinica

    try {
      const response = await pool.query(
        'SELECT * FROM historia_clinico WHERE id_historia_clinica = $1',
        [ehrId],
      );
      if (response.rows.length === 0) {
        throw new DefaultError(
          'NotFoundError',
          'Historia clinica no encontrada',
          404,
        );
      }
      ehr = response.rows[0];
    } catch (err) {
      throw new DefaultError('DatabaseError', 'Error al obtener EHR', 500);
    }

    try {
    } catch (err) {}
  }
  static async createHCFisiatric(ehrId, hcFisiatric) {
    const {
      antecedentes,
      medicacionActual,
      estudiosRealziados,
      fisiologico,
      anamnesisSistemica,
      examenFisico,
      diagnosticoFuncional,
      conductaSeguir,
    } = hcFisiatric;

    const query =
      'INSERT INTO hc_fisiatrica (id_historia_clinica, antecedentes, medicacion_actual, estudios_realizados, fisiologico, anamnesis_sistemica, examen_fisico, diagnostico_funcional, conducta_seguir) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *';
    const values = [
      ehrId,
      antecedentes,
      medicacionActual,
      estudiosRealziados,
      fisiologico,
      anamnesisSistemica,
      examenFisico,
      diagnosticoFuncional,
      conductaSeguir,
    ];
    try {
      const { rows } = await pool.query(query, values);
      return rows[0];
    } catch (err) {
      throw new DefaultError(
        'DatabaseError',
        'Error al crear HC Fisiatrica',
        500,
      );
    }
  }
}
