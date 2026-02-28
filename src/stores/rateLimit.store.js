import { pool } from '../configs/config.js';

/**
 * Store de express-rate-limit que persiste el estado en PostgreSQL.
 * Compatible con tabla rate_limit (key, count, reset_time).
 * El key puede ser "ip:..." para auth o "user:123" para límites por usuario.
 */
export class RateLimitPostgresStore {
  constructor(options = {}) {
    this.windowMs = options.windowMs ?? 15 * 60 * 1000;
  }

  async increment(key) {
    const result = await pool.query(
      `INSERT INTO rate_limit (key, count, reset_time)
       VALUES ($1, 1, NOW() + ($2::double precision / 1000) * INTERVAL '1 second')
       ON CONFLICT (key) DO UPDATE SET
         count = CASE WHEN rate_limit.reset_time < NOW() THEN 1 ELSE rate_limit.count + 1 END,
         reset_time = CASE WHEN rate_limit.reset_time < NOW() THEN NOW() + ($2::double precision / 1000) * INTERVAL '1 second' ELSE rate_limit.reset_time END
       RETURNING count AS "totalHits", reset_time AS "resetTime"`,
      [key, this.windowMs]
    );
    const row = result.rows[0];
    return {
      totalHits: Number(row.totalHits),
      resetTime: row.resetTime instanceof Date ? row.resetTime : new Date(row.resetTime),
    };
  }

  async decrement(key) {
    await pool.query(
      `UPDATE rate_limit SET count = GREATEST(0, count - 1) WHERE key = $1`,
      [key]
    );
  }

  async resetKey(key) {
    await pool.query(`DELETE FROM rate_limit WHERE key = $1`, [key]);
  }
}
