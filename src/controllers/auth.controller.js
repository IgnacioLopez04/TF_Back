import crypto from 'crypto';
import { verifyGoogleToken } from '../utils/oauth.js';
import { AuthModel } from '../models/auth.model.js';
import { createToken } from '../utils/token.js';
import { UserModel } from '../models/user.model.js';
import { ForbiddenError, BadRequestError } from '../errors/errors.js';
import { RefreshTokenModel } from '../models/refreshToken.model.js';

const generateRefreshToken = () => crypto.randomBytes(64).toString('hex');

export class AuthController {
  static async login(req, res, next) {
    const { credential } = req.body;
    let user;
    let access_token;
    let refresh_token;
    try {
      if (process.env.NODE_ENV === 'production') {
        const googleUser = await verifyGoogleToken(credential);
        user = await AuthModel.login(googleUser.email);
        if (!user)
          throw new ForbiddenError(
            'No estas autorizado para acceder al sistema.',
          );
        access_token = await createToken(user);
      } else {
        user = await AuthModel.login(credential);
        access_token = await createToken(user);
      }

      await UserModel.updateExpiredAt(user.hash_id);

      const userAgent = req.headers['user-agent'] || null;
      const rawIp = req.ip ?? req.socket?.remoteAddress ?? null;
      const ip =
        rawIp && rawIp.startsWith('::ffff:')
          ? rawIp.replace('::ffff:', '')
          : rawIp;

      refresh_token = generateRefreshToken();
      await RefreshTokenModel.create({
        id_usuario: user.id_usuario,
        token: refresh_token,
        user_agent: userAgent,
        ip_address: ip,
      });

      res.setHeader('Authorization', access_token);
      return res.json({
        user,
        access_token,
        refresh_token,
      });
    } catch (err) {
      next(err);
    }
  }

  static async refresh(req, res, next) {
    const { refresh_token } = req.body || {};

    if (!refresh_token) {
      return next(new BadRequestError('refresh_token es requerido.'));
    }

    try {
      const existing = await RefreshTokenModel.findValidByToken(refresh_token);

      if (!existing) {
        return next(
          new ForbiddenError('Refresh token inválido, expirado o revocado.'),
        );
      }

      const user = await AuthModel.findById(existing.id_usuario);

      if (!user) {
        await RefreshTokenModel.revokeByToken(refresh_token);
        return next(
          new ForbiddenError('No se pudo validar el usuario del refresh token.'),
        );
      }

      const access_token = await createToken(user);
      const new_refresh_token = generateRefreshToken();

      const userAgent = req.headers['user-agent'] || null;
      const rawIp = req.ip ?? req.socket?.remoteAddress ?? null;
      const ip =
        rawIp && rawIp.startsWith('::ffff:')
          ? rawIp.replace('::ffff:', '')
          : rawIp;

      await RefreshTokenModel.revokeByToken(refresh_token);
      await RefreshTokenModel.create({
        id_usuario: user.id_usuario,
        token: new_refresh_token,
        user_agent: userAgent,
        ip_address: ip,
      });

      res.setHeader('Authorization', access_token);
      return res.json({
        user,
        access_token,
        refresh_token: new_refresh_token,
      });
    } catch (err) {
      next(err);
    }
  }

  static async logout(req, res, next) {
    const { refresh_token } = req.body || {};

    try {
      if (refresh_token) {
        await RefreshTokenModel.revokeByToken(refresh_token);
      }
      return res.json({ message: 'Logout successful' });
    } catch (err) {
      next(err);
    }
  }
}

