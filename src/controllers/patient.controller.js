import { getPatientApi } from '../apis/fhirCommunity.js';
import { PatientModel } from '../models/patient.model.js';

export class PatientController {
   static async getPatient(req, res, next) {
      try {
         const result = await PatientModel.getPatient();
         return res.json(result);
      } catch (err) {
         res.status(500);
         next(err);
      }
   }

   // static async getPatientCom(req, res, next) {
   //   try {
   //     const { id } = req.body
   //     const result = await getPatientApi(id)
   //     return res.json(result.data)
   //   } catch (err) {
   //     console.log(err)
   //     res.status(500)
   //     next(err)
   //   }
   // }

   static async postPatient(req, res, next) {
      try {
         const id = 45057379;
         const { data } = await getPatientApi(id);

         // dni_paciente, nombre_paciente, apellido_paciente, fecha_nacimiento, id_provinicia, telefono
         const obj = {
            dni_paciente: data.id,
            nombre_paciente:
               data.name[0].given[0] + ' ' + data.name[0].given[1],
            apellido_paciente: data.name[0].family,
            fecha_nacimiento: data.birthDate,
            id_provinicia: 1,
            telefono: parseInt(data.telecom[0].value.replace(/-/g, ''), 10),
         };
         console.log(obj);
         await PatientModel.insertPatient(obj);
         return res.sendStatus(201);
      } catch (err) {
         console.log(err);
         next(err);
      }
   }

   static async deletePatient(req, res, next) {
      const { id_patient } = req.params;

      try {
         await PatientModel.deletePatient(Number(id_patient));
      } catch (error) {
         next(err);
      }
   }
}
