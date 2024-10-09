import { PatientModel } from '../models/patient.model.js'

export class PatientController {
  static async getPatient(req, res, next) {
    try {
      const result = await PatientModel.getPatient()
      return res.json(result)
    } catch (err) {
      res.status(500)
      next(err)
    }
  }
}
