import { BadRequestError, NotFoundError } from '../errors/errors.js';
import { PatientModel } from '../models/patient.model.js';
import { TutorModel } from '../models/abm.model.js';
import { cleanHashId, createHashId } from '../utils/encrypt.js';
import { EHRModel } from '../models/ehr.model.js';
export class PatientController {
  static async getPatient(req, res, next) {
    // El hash_id ya está limpio y el DNI está disponible en req.dni_paciente
    // gracias al middleware getPatientDni
    const { hash_id } = req;

    try {
      const result = await PatientModel.getPatient(hash_id);

      if (!result) {
        throw new NotFoundError('Paciente no encontrado');
      }
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

      // Crear los tutores si existen
      if (data.tutores && data.tutores.length > 0) {
        for (const tutor of data.tutores) {
          const tutorData = {
            ...tutor,
            dni_paciente: data.dni_paciente,
          };
          await TutorModel.insertTutor(tutorData);
        }
      }

      const hashId = createHashId(`${data.dni_paciente}${new Date()}`);
      await EHRModel.createEHR(data.dni_paciente, hashId);
      return res.status(201).json({ message: 'Paciente creado.' });
    } catch (err) {
      next(err);
    }
  }

  static async deletePatient(req, res, next) {
    // El DNI ya está disponible en req.dni_paciente gracias al middleware getPatientDni
    const { dni_paciente } = req;

    try {
      await PatientModel.deletePatient(dni_paciente);
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
