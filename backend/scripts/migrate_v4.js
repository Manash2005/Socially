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
    console.log('Starting migration v4 (Threaded Comments)...');

    // Add parent_id to comments table
    try {
      await db.query(`
        ALTER TABLE comments 
        ADD COLUMN parent_id INT NULL DEFAULT NULL,
        ADD CONSTRAINT fk_comments_parent FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
      `);
      console.log("Added parent_id column to comments table");
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log("Column parent_id already exists");
      } else {
        console.error("Failed to add parent_id:", e.message);
      }
    }

    console.log('Migration v4 completed.');
    process.exit(0);

  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
};

migrate();
