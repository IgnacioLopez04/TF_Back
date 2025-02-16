import express from 'express';

import { errorHandler } from './src/middlewares/errors.middleware.js';
import { PORT } from './src/configs/config.js';
import { router } from './src/routes/index.routes.js';

const app = express();

app.use(express.json());
app.disable('x-powered-by');

app.use('/api', router);

app.use(errorHandler);

app.listen(PORT, () => {
   console.log('El servidor corre en el puerto: ', PORT);
});
