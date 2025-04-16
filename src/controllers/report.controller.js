import { ReportModel } from '../models/report.model.js';

export class ReportController {
   static async createReport(req, res, next) {
      const { patientDni, userId, specialityId, tittle, text, reportType } =
         req.body;

      try {
         const reportId = await ReportModel.insertReport(
            userId,
            patientDni,
            text,
            reportType,
            tittle,
            specialityId,
         );
         res.json(reportId);
      } catch (err) {
         next(err);
      }
   }
}
