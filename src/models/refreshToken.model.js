import { pool } from '../configs/config.js';
import { InternalServerError } from '../errors/errors.js';

const REFRESH_TTL_DAYS = 1;

export class RefreshTokenModel {
  static async create({
    id_usuario,
    token,
    user_agent = null,
    ip_address = null,
  }) {
    try {
      const result = await pool.query(
        `
          INSERT INTO refresh_token (
            id_usuario,
            token,
            expires_at,
            user_agent,
            ip_address
          )
          VALUES ($1, $2, NOW() + INTERVAL '${REFRESH_TTL_DAYS} days', $3, $4)
          RETURNING *
        `,
        [id_usuario, token, user_agent, ip_address],
      );
      return result.rows[0];
    } catch (err) {
      throw new InternalServerError('Error al crear el refresh token.');
    }
  }

  static async findValidByToken(token) {
    try {
      const result = await pool.query(
        `
          SELECT *
          FROM refresh_token
          WHERE token = $1
            AND revoked_at IS NULL
            AND expires_at > NOW()
        `,
        [token],
      );
      return result.rows[0] || null;
    } catch (err) {
      throw new InternalServerError('Error al buscar el refresh token.');
    }
  }

  static async revokeByToken(token) {
    try {
      await pool.query(
        `
          UPDATE refresh_token
          SET revoked_at = NOW()
          WHERE token = $1
            AND revoked_at IS NULL
        `,
        [token],
      );
    } catch (err) {
      throw new InternalServerError('Error al revocar el refresh token.');
    }
  }

  static async revokeAllForUser(id_usuario) {
    try {
      await pool.query(
        `
          UPDATE refresh_token
          SET revoked_at = NOW()
          WHERE id_usuario = $1
            AND revoked_at IS NULL
        `,
        [id_usuario],
      );
    } catch (err) {
      throw new InternalServerError(
        'Error al revocar los refresh tokens del usuario.',
      );
    }
  }
}

