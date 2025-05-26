import express from 'express';
import cors from 'cors';
import fileUpload from 'express-fileupload';
import { errorHandler } from './src/middlewares/errors.middleware.js';
import { PORT } from './src/configs/config.js';
import { router } from './src/routes/index.routes.js';
import { authRouter } from './src/routes/auth.routes.js';
import { validateToken } from './src/utils/token.js';

const app = express();

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:8080'] }));
app.use(
   fileUpload({
      useTempFiles: false,
      limits: { fileSize: 10 * 1024 * 1024 }, //* límite de 10MB (ajustable)
      abortOnLimit: true,
   }),
);
app.use(express.json());
app.disable('x-powered-by');

app.use('/auth', authRouter);
app.use('/api', router);
// app.use('/api', validateToken, router);

app.use(errorHandler);

app.listen(PORT, () => {
   console.log('El servidor corre en el puerto: ', PORT);
});
