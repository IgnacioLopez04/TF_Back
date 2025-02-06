import { ProfessionalModel } from '../models/professional.model.js';

export class ProfessionalController {
   static async getProfessional(req, res, next) {
      const { id_professional } = req.params;

      try {
         const professional = await ProfessionalModel.getProfessional(
            Number(id_professional),
         );
         res.json(professional.rows[0]);
      } catch (err) {
         next(err);
      }
   }

   static async getAllProfessionals(req, res, next) {
      try {
         const professionals = await ProfessionalModel.getAllProfessionals();
         res.json(professionals.rows);
      } catch (err) {
         next(err);
      }
   }

   static async insertProfessional(req, res, next) {
      const { id_user, specialities } = req.body;

      try {
         await ProfessionalModel.insertProfessional(id_user, specialities);
         res.sendStatus(201).json({ message: 'Profesional creado.' });
      } catch (err) {
         next(err);
      }
   }
}
