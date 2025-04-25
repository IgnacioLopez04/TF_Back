import { OAuth2Client } from 'google-auth-library';
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } from '../configs/config.js';

const client = new OAuth2Client(GOOGLE_CLIENT_SECRET);

export const verifyGoogleToken = async (idToken) => {
   const ticket = await client.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID,
   });

   const payload = ticket.getPayload();
   return payload;
};
