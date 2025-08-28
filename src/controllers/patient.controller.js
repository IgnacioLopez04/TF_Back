import { BadRequestError, NotFoundError } from '../errors/errors.js';
import { PatientModel } from '../models/patient.model.js';

export class PatientController {
  static async getPatient(req, res, next) {
    const { dni_paciente } = req.params;
    if (!dni_paciente) throw new BadRequestError('DNI no proporcionado.');
    try {
      const result = await PatientModel.getPatient(dni_paciente);
      return res.json(result);
    } catch (err) {
      next(err);
    }
  }

  static async getPatients(req, res, next) {
    try {
      const patients = await PatientModel.getPatients();
      return res.json(patients);
    } catch (err) {
      next(err);
    }
  }

  static async postPatient(req, res, next) {
    try {
      const data = req.body;

      await PatientModel.insertPatient({
        ...data,
        id_ciudad: data.id_ciudad || null,
        barrio_paciente: data.barrio || null,
        calle_paciente: data.calle || null,
        id_prestacion: data.id_prestacion || null,
        piso_departamento: data.piso_departamento || null,
      });
      return res.status(201).json({ message: 'Paciente creado.' });
    } catch (err) {
      next(err);
    }
  }

  static async deletePatient(req, res, next) {
    const { dni_paciente } = req.params;

    try {
      const patient = await PatientModel.getPatient(dni_paciente);
      if (!patient) throw new NotFoundError('Paciente no encontrado.');

      await PatientModel.deletePatient(Number(dni_paciente));
      return res.status(200).json({ message: 'Paciente eliminado.' });
    } catch (error) {
      next(error);
    }
  }

  static async updatePatient(req, res, next) {
    const data = req.body;

    try {
      await PatientModel.updatePatient(data);
      return res.status(200).json({ message: 'Paciente actualizado.' });
    } catch (err) {
      next(err);
    }
  }
}
