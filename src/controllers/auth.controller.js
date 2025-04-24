export class AuthController {
   static async login(req, res, next) {
      const { email, password } = req.body;

      try {
         const user = await AuthModel.login(email, password);
         if (!user) {
            return res.status(403).send('El DNI o contraseña son incorrectas.');
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
