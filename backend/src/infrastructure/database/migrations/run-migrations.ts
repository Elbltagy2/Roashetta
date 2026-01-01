import { pool } from '../config';
import fs from 'fs';
import path from 'path';

async function runMigrations() {
  const migrationsDir = __dirname;
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  console.log('Running migrations...');

  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf-8');

    try {
      await pool.query(sql);
      console.log(`✓ ${file}`);
    } catch (error) {
      console.error(`✗ ${file}:`, error);
      throw error;
    }
  }

  console.log('All migrations completed successfully!');
  await pool.end();
}

runMigrations().catch(console.error);
