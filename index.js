import express from 'express';
import cors from 'cors';
import fileUpload from 'express-fileupload';
import { errorHandler } from './src/middlewares/errors.middleware.js';
import { PORT } from './src/configs/config.js';
import { validateToken } from './src/utils/token.js';
import { router as apiRouter } from './src/routes/index.routes.js';
import { router as authRouter } from './src/routes/auth.routes.js';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import { NotFoundError } from './src/errors/errors.js';

const swaggerDocument = YAML.load('./docs/swagger.yaml');
const app = express();

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use(
  cors({
    origin: [
      'http://localhost:5173',
      'http://localhost:8080',
      'http://localhost:8081',
    ],
  }),
);
app.use(
  fileUpload({
    useTempFiles: false,
    limits: { fileSize: 50 * 1024 * 1024 }, //* límite de 50MB (ajustable)
    abortOnLimit: true,
    parseNested: true,
  }),
);
app.use(express.json());
app.disable('x-powered-by');

app.use('/auth', authRouter);

app.use(validateToken);
app.use('/api', apiRouter);
app.use((req, res, next) => {
  next(new NotFoundError('Ruta no encontrada'));
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log('El servidor corre en el puerto: ', PORT);
});
