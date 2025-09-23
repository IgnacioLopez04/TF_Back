import { ReportModel } from '../models/report.model.js';
import { createHashId } from '../utils/encrypt.js';

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
      const reportId = await ReportModel.insertReport(
        userId,
        patientDni,
        text,
        reportType,
        tittle,
        specialityId,
        ehrId,
        hashId,
      );
      return res.json({ id_informe: reportId });
    } catch (err) {
      next(err);
    }
  }
  static async createAnnex(req, res, next) {
    const { reportHashId, userId, text } = req.body;

    console.log(userId);
    console.log(reportHashId);
    console.log(text);

    const report = await ReportModel.getReport(reportHashId);
    if (!report) {
      return res.status(404).json({ message: 'Reporte no encontrado' });
    }
    const hashId = createHashId(`${report.id_informe}${userId}${text}`);

    try {
      const annex = await ReportModel.insertAnnex(
        report.id_informe,
        userId,
        text,
        hashId,
      );
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
