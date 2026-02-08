import dotenv from 'dotenv';

// Load environment variables from .env file if it exists (local development)
dotenv.config();

const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'JWT_SECRET'
];

const validateEnv = () => {
  const missing = requiredEnvVars.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.error('❌ Critical Environment Variables Missing:');
    missing.forEach(key => console.error(`   - ${key}`));
    console.error('\nEnsure these are set in your Render dashboard or local .env file.\n');

    // In production, we want to crash if these are missing to avoid cryptic errors later
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

validateEnv();

export const env = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseKey: process.env.SUPABASE_ANON_KEY,
  jwtSecret: process.env.JWT_SECRET,
};
