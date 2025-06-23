import { verifyGoogleToken } from '../utils/oauth.js';
import { AuthModel } from '../models/auth.model.js';
import { createToken } from '../utils/token.js';
import { UserModel } from '../models/user.model.js';

export class AuthController {
  static async login(req, res, next) {
    const { credential } = req.body;
    let user;
    let access_token;
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

      await UserModel.updateExpiredAt(user.id_usuario);

      res.cookie('access_token', access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'none',
      });
      return res.json({
        user,
      });
    } catch (err) {
      next(err);
    }
  }
}
