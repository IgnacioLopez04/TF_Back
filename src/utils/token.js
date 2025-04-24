import jwt from 'jsonwebtoken';
import { SECRET_KEY } from '../configs/config.js';

export const createToken = async (user) => {
   const { id_usuario, email, id_tipo_usuario } = user;

   const token = jwt.sign({ id_usuario, email, id_tipo_usuario }, SECRET_KEY, {
      expiresIn: '1h',
   });
   return token;
};

export const validateToken = async (req, res, next) => {
   const token = req.headers['authoritation'];

   jwt.verify(token, SECRET_KEY, (err, decoded) => {
      if (err) {
         return res.status(403).send('Token expired or invalid');
      }

      res.user = decoded;
      next();
   });
};
