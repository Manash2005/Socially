import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

export const env = {
  port: process.env.PORT,
  nodeEnv: process.env.NODE_ENV,
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseKey: process.env.SUPABASE_ANON_KEY,
  jwtSecret: process.env.JWT_SECRET,
};
