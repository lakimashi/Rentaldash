import 'dotenv/config';
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rawPath = process.env.SQLITE_PATH || process.env.DATABASE_URL || path.join(__dirname, '..', 'data', 'rental.db');
const dbPath = path.isAbsolute(rawPath) ? rawPath : path.resolve(path.join(__dirname, '..'), rawPath);
const schemaPath = path.join(__dirname, '..', 'schema.sqlite.sql');
const migrationPath = path.join(__dirname, '..', 'migrations', 'add_missing_columns.sql');

const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const sql = fs.readFileSync(schemaPath, 'utf8');
db.exec(sql);
console.log('SQLite schema applied successfully.');

// Run migration to add missing columns if it exists
if (fs.existsSync(migrationPath)) {
  try {
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');
    db.exec(migrationSql);
    console.log('Migration applied successfully.');
  } catch (e) {
    if (e.message.includes('duplicate column')) {
      console.log('Columns already exist, skipping migration.');
    } else {
      throw e;
    }
  }
}

// Initialize settings with environment variables
const businessName = process.env.BUSINESS_NAME || 'Rental Agency';
const defaultCurrency = process.env.DEFAULT_CURRENCY || 'USD';
const defaultVatPercent = parseFloat(process.env.DEFAULT_VAT_PERCENT || '0');

const initSettings = db.prepare(`
  INSERT OR IGNORE INTO settings (id, agency_name, currency, vat_percent)
  VALUES (1, ?, ?, ?)
`);
initSettings.run(businessName, defaultCurrency, defaultVatPercent);
console.log('Settings initialized:', { businessName, defaultCurrency, defaultVatPercent });

db.close();
