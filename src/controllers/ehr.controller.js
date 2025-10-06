import { EHRModel } from '../models/ehr.model.js';

export class EHRController {
  static hcFisiatric = async (req, res, next) => {
    try {
      const ehr = await EHRModel.getEHRByDNI(req.dni_paciente);
      if (!ehr) {
        return res.status(404).json({ message: 'EHR no encontrado.' });
      }

      const { hc_fisiatric } = req.body;
      if (!hc_fisiatric && !ehr.id_historia_clinica) {
        return res
          .status(400)
          .json({ message: 'Datos de HC Fisiatric no proporcionados.' });
      }

      await EHRModel.createHCFisiatric(ehr.id_historia_clinica, hc_fisiatric);
      return res
        .status(201)
        .json({ message: 'HC Fisiatric creada exitosamente.' });
    } catch (err) {
      next(err);
    }
  };
  static getHCFisiatric = async (req, res, next) => {
    try {
      const ehr = await EHRModel.getEHRByDNI(req.dni_paciente);
      if (!ehr) {
        return res.status(404).json({ message: 'EHR no encontrado.' });
      }

      const hc_fisiatric = await EHRModel.getHCFisiatric(
        ehr.id_historia_clinica,
      );

      // Si no hay historia fisiatrica, devolver null
      if (!hc_fisiatric) {
        return res.status(200).json(null);
      }

      // Asegurar que los campos JSON se devuelvan como strings JSON válidos
      const hc_fisiatric_response = {
        ...hc_fisiatric,
        evaluacion_consulta: JSON.stringify(hc_fisiatric.evaluacion_consulta),
        antecedentes: JSON.stringify(hc_fisiatric.antecedentes),
        anamnesis_sistemica: JSON.stringify(hc_fisiatric.anamnesis_sistemica),
        examen_fisico: JSON.stringify(hc_fisiatric.examen_fisico),
        diagnostico_funcional: JSON.stringify(
          hc_fisiatric.diagnostico_funcional,
        ),
      };

      return res.status(200).json(hc_fisiatric_response);
    } catch (err) {
      next(err);
    }
  };
}
