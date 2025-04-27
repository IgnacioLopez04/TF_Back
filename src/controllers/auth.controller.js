import { verifyGoogleToken } from '../utils/oauth.js';
import { AuthModel } from '../models/auth.model.js';
import { createToken } from '../utils/token.js';
import { UserModel } from '../models/user.model.js';

export class AuthController {
   static async login(req, res, next) {
      const { credential } = req.body;
      try {
         const googleUser = await verifyGoogleToken(credential);

         const user = await AuthModel.login(googleUser.email);
         if (!user) {
            return res
               .status(403)
               .send('No estas autorizado para acceder al sistema.');
         }
         const access_token = await createToken(user);
         await UserModel.updateExpiredAt(user.id_usuario);
         return res.json({
            access_token,
            user,
         });
      } catch (err) {
         next(err);
      }
   }
}
