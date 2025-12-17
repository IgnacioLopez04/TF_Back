import { UserModel } from '../models/user.model.js';
import { createHashId } from '../utils/encrypt.js';
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
        return res.status(400).json({ message: 'Usuario ya existe.' });
      }
    } catch (err) {
      next(err);
    }

    try {
      const hashId = createHashId(user.dni_usuario + user.fecha_nacimiento);
      await UserModel.insertUser({ ...user, hash_id: hashId });
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
    const { hash_id } = req.params;
    try {
      await UserModel.blockUser(hash_id);
      return res.status(200).send('Usuario bloqueado.');
    } catch (err) {
      next(err);
    }
  }
  static async activateUser(req, res, next) {
    const { hash_id } = req.params;
    try {
      await UserModel.activateUser(hash_id);
      return res.status(200).send('Usuario activado.');
    } catch (err) {
      next(err);
    }
  }
  static async getUserType(req, res, next) {
    try {
      const userType = await UserModel.getUserType();
      return res.json(userType);
    } catch (err) {
      next(err);
    }
  }
  static async updateUser(req, res, next) {
    const { hash_id } = req.params;
    const { user } = req.body;

    try {
      await UserModel.updateUser(hash_id, user);
      return res.status(200).json({ message: 'Usuario actualizado.' });
    } catch (err) {
      next(err);
    }
  }
}
