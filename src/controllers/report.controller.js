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
         return res.json(reportId);
      } catch (err) {
         next(err);
      }
   }
   static async createAnnex(req, res, next) {
      const { reportId, userId, text } = req.body;

      try {
         const annex = await ReportModel.insertAnnex(reportId, userId, text);
         return res.status(201).end();
      } catch (err) {
         next(err);
      }
   }
   static async getReport(req, res, next) {
      const { reportId } = req.params;

      try {
         const report = await ReportModel.getReport(reportId);
         const annexes = await ReportModel.getAllAnnexByReport(reportId);

         return res.json({ report, annexes });
      } catch (err) {
         next(err);
      }
   }
   static async getReports(req, res, next) {
      const { patientDni } = req.params;

      try {
         const reports = await ReportModel.getReports(patientDni);

         const result = await Promise.all(
            reports.map(async (report) => {
               const annexs = await ReportModel.getAllAnnexByReport(
                  report.id_informe,
               );
               return {
                  report,
                  annexs,
               };
            }),
         );
         return res.json(result);
      } catch (err) {
         next(err);
      }
   }
}
