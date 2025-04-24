import process from 'process';
import dotenv from 'dotenv';
import pg from 'pg';

const { Pool } = pg;

dotenv.config();

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
   PATH_FILES = process.env.PATH_FILES,
   AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID,
   AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY,
   AWS_REGION = process.env.AWS_REGION,
   AWS_S3_BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME,
   SECRET_KEY = proccess.env.SECRET_KEY,
} = process.env;
