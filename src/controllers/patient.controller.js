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
      //* dni_paciente, nombre_paciente, apellido_paciente, fecha_nacimiento, id_provinicia, telefono
      const obj = {
        dni_paciente: data.id,
        nombre_paciente: data.name[0].given[0] + ' ' + data.name[0].given[1],
        apellido_paciente: data.name[0].family,
        fecha_nacimiento: data.birthDate,
        telefono: parseInt(data.telecom[0].value.replace(/-/g, ''), 10),
      };
      await PatientModel.insertPatient(obj);
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
