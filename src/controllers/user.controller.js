import { UserModel } from '../models/user.model.js';
export class UserController {
   static async getUser(req, res, next) {
      const { dni } = req.params;
      try {
         const user = await UserModel.getUser(dni);
         res.json(user);
      } catch (err) {
         next(err);
      }
   }
   static async getUsers(req, res, next) {
      try {
         const users = await UserModel.getUsers();
         res.json(users);
      } catch (err) {
         next(err);
      }
   }
   static async getActiveUsers(req, res, next) {
      try {
         const users = await UserModel.getActiveUsers();
         res.json(users);
      } catch (err) {
         next(err);
      }
   }
   static async insertUser(req, res, next) {
      const { user } = req.body;

      try {
         const exist = await UserModel.getUser(user.dni_usuario);
         if (exist) {
            if (exist.inactivo) {
               try {
                  await UserModel.activeUser(exist.dni_usuario);
               } catch (err) {
                  next(err);
               }
            }
            return res.json(exist);
         }
      } catch (err) {
         next(err);
      }

      try {
         await UserModel.insertUser(user);
         res.status(201).json({ message: 'Usuario creado.' });
      } catch (err) {
         next(err);
      }
   }
   static async updateExpiredAt(req, res, next) {
      const { userDni } = req.body;
      try {
         await UserModel.updateExpiredAt(userDni);
         return res.status(200).send('Fecha de expiracion actualizada.');
      } catch (err) {
         next(err);
      }
   }
   static async blockUser(req, res, next) {
      const { userDni } = req.params;
      try {
         await UserModel.blockUser(userDni);
         return res.status(200).send('Usuario bloqueado.');
      } catch (err) {
         next(err);
      }
   }
   static async activateUser(req, res, next) {
      const { userDni } = req.body;
      try {
         await UserModel.activateUser(userDni);
         return res.status(200).send('Usuario activado.');
      } catch (err) {
         next(err);
      }
   }
}
