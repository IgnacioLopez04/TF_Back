import { BadRequestError, NotFoundError } from '../errors/errors.js';
import { PatientModel } from '../models/patient.model.js';
import { TutorModel, GeneralModel } from '../models/abm.model.js';
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

      if (!result.id_mutual) {
        const dm = await GeneralModel.getDatosMutualByDniPaciente(
          result.dni_paciente,
        );
        if (dm) {
          result.id_mutual = dm.id_mutual;
          result.numero_afiliado = dm.numero_afiliado;
        }
      }

      // Obtener tutores del paciente (puede retornar array vacío si no hay tutores)
      const tutores = await TutorModel.getTutoresByDniPaciente(result.dni_paciente);
      
      // Mapear tutores al formato esperado por el frontend
      // Si no hay tutores, tutores será un array vacío [] y tutoresMapeados también será []
      const tutoresMapeados = tutores && tutores.length > 0
        ? tutores.map(tutor => ({
            nombre: tutor.nombre,
            dni: tutor.dni,
            fechaNacimiento: tutor.fecha_nacimiento,
            ocupacion: tutor.ocupacion,
            lugarNacimiento: tutor.lugar_nacimiento,
            relacion: tutor.relacion,
            convive: tutor.convive
          }))
        : [];

      // Agregar tutores al resultado (será [] si no hay tutores)
      result.tutores = tutoresMapeados;

      console.log(result);
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
      const result = await PatientModel.insertPatient({
        ...data,
        id_ciudad: data.id_ciudad || null,
        barrio_paciente: data.barrio || null,
        calle_paciente: data.calle || null,
        numero_calle: data.numero || data.numero_calle || null,
        id_prestacion: data.id_prestacion || null,
        piso_departamento: data.piso_departamento || null,
        vive_con: data.vive_con || null,
        ocupacion_actual: data.ocupacion_actual ?? data.ocupacionActual ?? null,
        ocupacion_anterior: data.ocupacion_anterior ?? data.ocupacionAnterior ?? null,
      });

      const id_mutual = data.id_mutual ?? data.mutual;
      const numero_afiliado = data.numero_afiliado ?? data.numeroAfiliado;
      if (
        id_mutual != null &&
        id_mutual !== '' &&
        numero_afiliado != null &&
        numero_afiliado !== ''
      ) {
        await GeneralModel.insertDatosMutual({
          id_mutual,
          dni_paciente: data.dni_paciente,
          numero_afiliado,
        });
      }

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
    const dni_paciente_viejo = req.dni_paciente;
    const ocupacion_actual =
      data.ocupacion_actual ?? data.ocupacionActual ?? null;
    const ocupacion_anterior =
      data.ocupacion_anterior ?? data.ocupacionAnterior ?? null;
    const id_mutual = data.id_mutual ?? data.mutual;
    const numero_afiliado = data.numero_afiliado ?? data.numeroAfiliado;

    try {
      await PatientModel.updatePatient({
        ...data,
        barrio_paciente: data.barrio ?? data.barrio_paciente ?? null,
        calle_paciente: data.calle ?? data.calle_paciente ?? null,
        numero_calle: data.numero ?? data.numero_calle ?? null,
        ocupacion_actual,
        ocupacion_anterior,
        dni_paciente_viejo,
      });

      if (
        id_mutual != null &&
        id_mutual !== '' &&
        numero_afiliado != null &&
        numero_afiliado !== ''
      ) {
        await GeneralModel.upsertDatosMutual(
          data.dni_paciente ?? dni_paciente_viejo,
          id_mutual,
          numero_afiliado,
        );
      } else {
        await GeneralModel.deleteDatosMutualByDniPaciente(dni_paciente_viejo);
      }

      return res.status(200).json({ message: 'Paciente actualizado.' });
    } catch (err) {
      next(err);
    }
  }
}
