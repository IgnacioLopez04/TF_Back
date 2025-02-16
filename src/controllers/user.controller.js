import { UserModel } from '../models/user.model.js';
export class UserController {
   static async getUser(req, res, next) {
      const { dni_user } = req.params;
      try {
         const user = await UserModel.getUser(dni_user);
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
   static async insertUser(req, res, next) {
      const { user } = req.body;

      try {
         const exist = await UserModel.getUser(user.dni_usuario);
         if (exist) {
            return res.json(exist);
         }
      } catch (err) {
         next(err);
      }

      try {
         await UserModel.insertUser(user);
         res.sendStatus(201).json({ message: 'Usuario creado.' });
      } catch (err) {
         next(err);
      }
   }
   static async deleteUser(req, res, next) {
      const { id_user } = req.params;
      try {
         await UserModel.deleteUser(Number(id_user));
         res.sendStatus(200).json({ message: 'Usuario eliminado.' });
      } catch (err) {
         next(err);
      }
   }
}
