import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from backend/.env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const migrate = async () => {
  // Dynamic import to ensure env variables are loaded first
  const { db } = await import('../src/config/db.js');

  try {
    console.log('Starting migration v3...');

    // Verify connection
    try {
      await db.query('SELECT 1');
      console.log('DB Connection OK');
    } catch (e) {
      console.error('DB Connection Failed', e);
      process.exit(1);
    }

    // Change visibility column to VARCHAR(50) to allow any string
    try {
      await db.query("ALTER TABLE posts MODIFY COLUMN visibility VARCHAR(50) DEFAULT 'campus'");
      console.log("Modified posts.visibility to VARCHAR(50)");
    } catch (e) {
      console.error("Failed to modify visibility:", e.message);
    }

    console.log('Migration v3 completed.');
    process.exit(0);

  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
};

migrate();
