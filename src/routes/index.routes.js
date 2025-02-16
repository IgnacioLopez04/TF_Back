import { Router } from 'express';
import { readdirSync } from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PATH_ROUTER = __dirname; // Ruta del directorio actual
const router = Router();

/**
 * Hacemos esto para que el nombre del archivo dentro de routes sea el prefijo del endpoint.
 * @returns
 */

const cleanFileName = (fileName) => fileName.replace('.routes.js', '');

// Si el nombre del archivo es distinto a index se agrega al router
readdirSync(PATH_ROUTER).filter((fileName) => {
   if (fileName !== 'index.routes.js') {
      const cleanName = cleanFileName(fileName);
      import(`./${cleanName}.routes.js`)
         .then((moduleRouter) => {
            router.use(`/${cleanName}`, moduleRouter.router);
         })
         .catch((err) => console.error(`Error al importar ${cleanName}:`, err));
   }
});

export { router };
