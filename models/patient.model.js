import { pool } from '../configs/config.js'
import { DatabaseError, NotFoundError } from '../errors/errors.js'

export class PatientModel {
  static async getPatient() {
    try {
      const res = await pool.query('SELECT * FROM paciente')
      if (!res || res.rowCount === 0) {
        throw new NotFoundError('No se encontraron pacientes', 404)
      }
      return res.rows
    } catch (e) {
      if (e instanceof NotFoundError) throw e
      throw new DatabaseError('Error al consultar el paciente', 500)
    }
  }
}
