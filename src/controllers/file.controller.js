import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { AWS_REGION, AWS_S3_BUCKET_NAME } from '../configs/config.js';
import s3 from '../configs/s3.js';
import { FileModel } from '../models/file.model.js';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ReportModel } from '../models/report.model.js';

export class FileControlller {
   static async uploadFile(req, res, next) {
      try {
         const { userId, patientDni, reportId } = req.body;
         const { files } = req;

         if (!files) {
            return res
               .status(400)
               .json({ error: 'No se encontraron archivos para subir' });
         }

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
            if (!allowTypes.includes(file.mimetype)) {
               return res
                  .json(400)
                  .json({ error: 'Tipo de archivo no permitido' });
            }
         });

         await Promise.all(
            filesArray.map(async (file) => {
               const fileKey = `uploads/${patientDni}/${Date.now()}_${
                  file.name
               }`; // nombre único

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
                  patientDni,
                  userId,
                  fileUrl,
                  file.name,
                  file.mimetype,
                  fileKey,
               );
               if (reportId) {
                  await ReportModel.addFileReport(reportId, fileId);
               }
            }),
         );

         return res.status(201).end();
      } catch (err) {
         next(err);
      }
   }
   static async getFiles(req, res, next) {
      try {
         const { patientDni, fileType } = req.query;
         const files = await FileModel.getFiles(patientDni, fileType);

         const signedFiles = await Promise.all(
            files.map(async (file) => {
               const command = new GetObjectCommand({
                  Bucket: AWS_S3_BUCKET_NAME,
                  Key: file.key,
               });

               const url = await getSignedUrl(s3, command, {
                  expiresIn: 60 * 10, //* 10 minutos
               });

               return {
                  name: file.nombre,
                  type: file.tipo_archivo,
                  url,
               };
            }),
         );

         return res.json(signedFiles);
      } catch (err) {
         next(err);
      }
   }
}
