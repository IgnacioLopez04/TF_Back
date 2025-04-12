import { PutObjectCommand } from '@aws-sdk/client-s3';
import { AWS_REGION, AWS_S3_BUCKET_NAME } from '../configs/config.js';
import s3 from '../configs/s3.js';
import { FileModel } from '../models/file.model.js';

export class FileControlller {
   static async uploadFile(req, res, next) {
      try {
         const { id_usuario, dni_paciente } = req.body;
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
               const fileKey = `uploads/${dni_paciente}/${Date.now()}_${
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
               await FileModel.insertFile(
                  dni_paciente,
                  id_usuario,
                  fileUrl,
                  file.name,
                  file.mimetype,
               );
            }),
         );

         return res.status(201).end();
      } catch (err) {
         console.log(err);
         next(err);
      }
   }
}
