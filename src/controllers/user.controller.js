import { UserModel } from '../models/user.model';
export class UserController {
   static async getUser(req, res, next) {
      const { id_user } = req.params;
      try {
         const user = await UserModel.getUser(id_user);
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
         await UserModel.insertUser(user);
         res.senStatus(201).json({ message: 'Usuario creado.' });
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
