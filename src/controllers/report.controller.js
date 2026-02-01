import { ReportModel } from '../models/report.model.js';
import { createHashId } from '../utils/encrypt.js';
import { EHRModel } from '../models/ehr.model.js';

export class ReportController {
  static async createReport(req, res, next) {
    const {
      patientDni,
      userId,
      specialityId,
      tittle,
      text,
      reportType,
      ehrId,
    } = req.body;

    const hashId = createHashId(`${patientDni}${tittle}${userId}`);

    try {
      const ehr = await EHRModel.getEHR(ehrId);
      if (!ehr) {
        return res.status(404).json({ message: 'EHR no encontrado' });
      }

      const reportId = await ReportModel.insertReport(
        userId,
        patientDni,
        text,
        reportType,
        tittle,
        specialityId,
        ehr.id_historia_clinica,
        hashId,
      );

      await EHRModel.updateModificationDate(ehr.hash_id);
      return res.json({ id_informe: reportId });
    } catch (err) {
      next(err);
    }
  }
  static async createAnnex(req, res, next) {
    const { reportHashId, userId, text } = req.body;

    const report = await ReportModel.getReport(reportHashId);
    if (!report) {
      return res.status(404).json({ message: 'Reporte no encontrado' });
    }
    const hashId = createHashId(`${report.id_informe}${userId}${text}`);

    try {
      await ReportModel.insertAnnex(report.id_informe, userId, text, hashId);
      const ehr = await EHRModel.getEHRByIdHistoriaClinica(
        report.id_historia_clinica,
      );
      if (ehr) {
        await EHRModel.updateModificationDate(ehr.hash_id);
      }
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
    const { dni_paciente } = req;

    try {
      const reports = await ReportModel.getReports(dni_paciente);
      return res.json(reports);
    } catch (err) {
      next(err);
    }
  }
  static async getAnnexByReport(req, res, next) {
    const { reportHashId } = req.params;

    try {
      const report = await ReportModel.getReport(reportHashId);
      if (!report) {
        return res.status(404).json({ message: 'Reporte no encontrado' });
      }

      const annexes = await ReportModel.getAllAnnexByReport(report.id_informe);
      return res.json(annexes);
    } catch (err) {
      next(err);
    }
  }
}
