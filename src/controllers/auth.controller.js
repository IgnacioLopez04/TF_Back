import { verifyGoogleToken } from '../utils/oauth.js';

export class AuthController {
   static async login(req, res, next) {
      const { idToken } = req.body;
      try {
         const googleUser = await verifyGoogleToken(idToken);

         const user = await AuthModel.login(googleUser.email);
         if (!user) {
            return res
               .status(403)
               .send('No estas autorizado para acceder al sistema.');
         }
         const access_token = await createToken(user);
         return res.json({
            access_token,
            user,
         });
      } catch (err) {
         next(err);
      }
   }
}
