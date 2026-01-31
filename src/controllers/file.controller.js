import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { AWS_REGION, AWS_S3_BUCKET_NAME } from '../configs/config.js';
import s3 from '../configs/s3.js';
import { EHRModel } from '../models/ehr.model.js';
import { FileModel } from '../models/file.model.js';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ReportModel } from '../models/report.model.js';
import { UnsupportedMediaTypeError } from '../errors/errors.js';

export class FileControlller {
  static async uploadFile(req, res, next) {
    try {
      const { userId, reportId, titulo, descripcion } = req.body;
      const { dni_paciente } = req;
      const { files } = req;

      if (!files) throw new Error('No se encontraron archivos para subir');

      const filesArray = Array.isArray(files?.files)
        ? files.files
        : [files?.files];

      const allowTypes = [
        'image/jpeg',
        'image/png',
        'application/pdf',
        'video/mp4',
      ];
      filesArray.map((file) => {
        if (!allowTypes.includes(file.mimetype))
          throw new UnsupportedMediaTypeError('Tipo de archivo no permitido');
      });

      const uploadedFiles = [];

      await Promise.all(
        filesArray.map(async (file) => {
          const fileKey = `uploads/${dni_paciente}/${Date.now()}_${file.name}`; // nombre único

          // Sube a S3
          const uploadParams = {
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Key: fileKey,
            Body: file.data,
            ContentType: file.mimetype,
            ACL: 'private', // o 'public-read' si querés acceso público
          };

          const command = new PutObjectCommand(uploadParams);
          await s3.send(command);

          const fileUrl = `https://${AWS_S3_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${fileKey}`;

          // Guarda la ruta (fileUrl) en la base de datos
          const fileId = await FileModel.insertFile(
            dni_paciente,
            userId,
            fileUrl,
            file.name,
            file.mimetype,
            fileKey,
            titulo || null,
            descripcion || null,
          );
          if (reportId) {
            await ReportModel.addFileReport(reportId, fileId);
          }

          uploadedFiles.push({
            fileId: fileId,
            fileName: file.name,
            fileType: file.mimetype,
            fileUrl: fileUrl,
          });
        }),
      );

      const ehr = await EHRModel.getEHRByDNI(dni_paciente);
      if (ehr) {
        await EHRModel.updateModificationDate(ehr.hash_id);
      }

      // Respuesta detallada para peticiones desde FHIR
      const response = {
        success: true,
        message: 'Archivos procesados exitosamente desde FHIR',
        patientDni: dni_paciente,
        userId: userId,
        reportId: reportId,
        uploadedFiles: uploadedFiles,
      };
      return res.status(201).json(response);
    } catch (err) {
      next(err);
    }
  }
  static async getFiles(req, res, next) {
    try {
      const { fileType } = req.query;
      const { dni_paciente } = req;

      const tipoArchivo = fileType || undefined;
      const files = await FileModel.getFiles(dni_paciente, tipoArchivo);

      const signedFiles = await Promise.all(
        files.map(async (file) => {
          const command = new GetObjectCommand({
            Bucket: AWS_S3_BUCKET_NAME,
            Key: file.key,
          });

          const url = await getSignedUrl(s3, command, {
            expiresIn: 60 * 10, // 10 minutos
          });

          return {
            id: file.id_documento,
            name: file.nombre,
            type: file.tipo_archivo,
            url,
            titulo: file.titulo || null,
            descripcion: file.descripcion || null,
            fechaCreacion: file.fecha_creacion || null,
          };
        }),
      );

      return res.json(signedFiles);
    } catch (err) {
      next(err);
    }
  }
}
