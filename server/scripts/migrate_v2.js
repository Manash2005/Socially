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

    console.log('Starting migration...');

    // 1. Add columns to posts table
    try {
      await db.query(`ALTER TABLE posts ADD COLUMN target_batches JSON DEFAULT NULL`);
      console.log('Added target_batches to posts');
    } catch (e) {
      if (e.code !== 'ER_DUP_FIELDNAME') console.error(e.message);
    }

    try {
      await db.query(`ALTER TABLE posts ADD COLUMN target_campuses JSON DEFAULT NULL`);
      console.log('Added target_campuses to posts');
    } catch (e) {
      if (e.code !== 'ER_DUP_FIELDNAME') console.error(e.message);
    }

    try {
      await db.query(`ALTER TABLE posts ADD COLUMN target_branches JSON DEFAULT NULL`);
      console.log('Added target_branches to posts');
    } catch (e) {
      if (e.code !== 'ER_DUP_FIELDNAME') console.error(e.message);
    }

    // 2. Add columns to users table (to support filtering later)
    try {
      await db.query(`ALTER TABLE users ADD COLUMN batch VARCHAR(20) DEFAULT NULL`);
      console.log('Added batch to users');
    } catch (e) {
      if (e.code !== 'ER_DUP_FIELDNAME') console.error(e.message);
    }

    try {
      await db.query(`ALTER TABLE users ADD COLUMN campus VARCHAR(50) DEFAULT NULL`);
      console.log('Added campus to users');
    } catch (e) {
      if (e.code !== 'ER_DUP_FIELDNAME') console.error(e.message);
    }

    try {
      await db.query(`ALTER TABLE users ADD COLUMN branch VARCHAR(50) DEFAULT NULL`);
      console.log('Added branch to users');
    } catch (e) {
      if (e.code !== 'ER_DUP_FIELDNAME') console.error(e.message);
    }

    console.log('Migration completed.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
};

migrate();
