import process from 'process'
import dotenv from 'dotenv'
import pg from 'pg'

const { Pool } = pg

dotenv.config()

export const {
  PORT = process.env.PORT,
  SALT_ROUNDS = process.env.SALT_ROUNDS,
  TOKEN_SECRET = process.env.TOKEN_SECRET,
  pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    port: process.env.DB_PORT,
    password: process.env.DB_PASSWORD,
    database: process.env.DB,
  }),
} = process.env
