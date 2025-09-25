import { EHRModel } from '../models/ehr.model.js';

export class EHRController {
  static hcFisiatric = async (req, res, next) => {
    const { ehrId } = req.body;
    try {
      const ehr = await EHRModel.getEHRId(ehrId);
      if (!ehr) throw new Error('EHR no encontrado.');
    } catch (err) {
      next(err);
    }

    const { hc_fisiatric } = req.body;
    if (!hc_fisiatric)
      throw new BadRequestError('Datos de HC Fisiatric no proporcionados.');

    try {
      await EHRModel.createHCFisiatric(ehrId, hc_fisiatric);
      return res
        .status(201)
        .json({ message: 'HC Fisiatric creada exitosamente.' });
    } catch (err) {
      next(err);
    }
  };
  static getHCFisiatric = async (req, res, next) => {
    const { ehrId } = req.body;
    try {
      const ehr = await EHRModel.getEHRId(ehrId);
      if (!ehr) throw new Error('EHR no encontrado.');
    } catch (err) {
      next(err);
    }
  };
}
