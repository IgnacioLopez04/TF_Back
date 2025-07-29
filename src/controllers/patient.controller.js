import { BadRequestError } from '../errors/errors.js';
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

      //* id_codigo_postal y id_barrio debo ver como se van a manejar
      await PatientModel.insertPatient({
        ...data,
        id_codigo_postal: null,
        id_barrio: null,
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
      next(err);
    }
  }
  static async updatePatient(req, res, next) {
    //! data = dni_paciente, nombre_paciente, apellido_paciente, fecha_nacimiento, id_codigo_postal, id_barrio, telefono, dni_paciente_viejo
    const { data } = req.body;

    try {
      await PatientModel.updatePatient(dni_paciente);
      return res.status(200).json({ message: 'Paciente actualizados.' });
    } catch (err) {
      next(err);
    }
  }
}
