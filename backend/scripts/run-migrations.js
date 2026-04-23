#!/usr/bin/env node

/**
 * Database Migration Runner
 * Executes SQL migration files to set up the database schema
 * 
 * Usage:
 *   node scripts/run-migrations.js
 *   node scripts/run-migrations.js --file 001_create_initial_schema.sql
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query, closePool } from '../src/config/database.js';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MIGRATIONS_DIR = path.join(__dirname, '../migrations');

/**
 * Read and execute a migration file
 * @param {string} filePath - Path to the migration file
 * @returns {Promise<void>}
 */
async function executeMigration(filePath) {
  try {
    console.log(`\n📋 Executing migration: ${path.basename(filePath)}`);
    
    const sql = fs.readFileSync(filePath, 'utf-8');
    
    // Split by semicolon to handle multiple statements
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    for (const statement of statements) {
      await query(statement);
    }
    
    console.log(`✅ Migration completed successfully: ${path.basename(filePath)}`);
  } catch (error) {
    console.error(`❌ Migration failed: ${path.basename(filePath)}`);
    console.error(`Error: ${error.message}`);
    throw error;
  }
}

/**
 * Get all migration files sorted by version
 * @returns {string[]} Array of migration file paths
 */
function getMigrationFiles() {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    console.warn(`⚠️  Migrations directory not found: ${MIGRATIONS_DIR}`);
    return [];
  }
  
  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(file => file.endsWith('.sql'))
    .sort();
  
  return files.map(file => path.join(MIGRATIONS_DIR, file));
}

/**
 * Main migration runner
 */
async function runMigrations() {
  try {
    console.log('🚀 Starting database migrations...');
    console.log(`📁 Migrations directory: ${MIGRATIONS_DIR}`);
    
    const args = process.argv.slice(2);
    let migrationsToRun = [];
    
    // Check if specific file is requested
    if (args.includes('--file') && args.length > 1) {
      const fileIndex = args.indexOf('--file');
      const fileName = args[fileIndex + 1];
      const filePath = path.join(MIGRATIONS_DIR, fileName);
      
      if (!fs.existsSync(filePath)) {
        console.error(`❌ Migration file not found: ${filePath}`);
        process.exit(1);
      }
      
      migrationsToRun = [filePath];
    } else {
      // Run all migrations
      migrationsToRun = getMigrationFiles();
      
      if (migrationsToRun.length === 0) {
        console.log('ℹ️  No migration files found');
        process.exit(0);
      }
    }
    
    console.log(`📊 Found ${migrationsToRun.length} migration(s) to execute\n`);
    
    // Execute each migration
    for (const migrationPath of migrationsToRun) {
      await executeMigration(migrationPath);
    }
    
    console.log('\n✨ All migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n💥 Migration process failed');
    console.error(error);
    process.exit(1);
  } finally {
    await closePool();
  }
}

// Run migrations
runMigrations();
