import { SpecialityModel } from '../models/speciality.model';

export class SpecialityController {
   static async getSpeciality(req, res, next) {
      const { id_speciality } = req.params;

      try {
         const speciality = await SpecialityModel.getSpeciality(id_speciality);
         res.json(speciality);
      } catch (err) {
         next(err);
      }
   }
   static async getSpecialities(req, res, next) {
      try {
         const specialities = await SpecialityModel.getAllSpecialities();
         res.json(specialities);
      } catch (err) {
         next(err);
      }
   }
   static async insertSpeciality(req, res, next) {
      const { description } = req.body;

      try {
         await SpecialityModel.insertSpeciality(description);
         res.sendStatus(201).json({ message: 'Especialidad creada.' });
      } catch (err) {
         next(err);
      }
   }
}
