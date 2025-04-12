import express from 'express';
import fileUpload from 'express-fileupload';
import { errorHandler } from './src/middlewares/errors.middleware.js';
import { PORT } from './src/configs/config.js';
import { router } from './src/routes/index.routes.js';

const app = express();

app.use(
   fileUpload({
      useTempFiles: false,
      limits: { fileSize: 10 * 1024 * 1024 }, //* límite de 10MB (ajustable)
      abortOnLimit: true,
   }),
);
app.use(express.json());
app.disable('x-powered-by');

app.use('/api', router);

app.use(errorHandler);

app.listen(PORT, () => {
   console.log('El servidor corre en el puerto: ', PORT);
});
