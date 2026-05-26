const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
};

async function setup() {
  console.log('🔄 Connecting to default database to verify/create target database...');
  // 1. Connect to default 'postgres' database
  const defaultClient = new Client({
    ...dbConfig,
    database: 'postgres',
  });

  try {
    await defaultClient.connect();
  } catch (err) {
    console.error('❌ Failed to connect to default PostgreSQL instance. Make sure PostgreSQL is running locally.');
    console.error('Details:', err.message);
    process.exit(1);
  }

  const targetDb = process.env.DB_NAME || 'ems_db';

  try {
    // Check if database exists
    const res = await defaultClient.query('SELECT 1 FROM pg_database WHERE datname = $1', [targetDb]);
    if (res.rowCount === 0) {
      console.log(`🔨 Database "${targetDb}" does not exist. Creating it...`);
      await defaultClient.query(`CREATE DATABASE ${targetDb}`);
      console.log(`✅ Database "${targetDb}" created successfully.`);
    } else {
      console.log(`ℹ️ Database "${targetDb}" already exists.`);
    }
  } catch (err) {
    console.error('❌ Error checking/creating database:', err.message);
    await defaultClient.end();
    process.exit(1);
  }

  await defaultClient.end();

  // 2. Connect to the newly created/existing target database to apply schema
  console.log(`🔄 Connecting to "${targetDb}" to apply database schema...`);
  const targetClient = new Client({
    ...dbConfig,
    database: targetDb,
  });

  try {
    await targetClient.connect();

    const schemaPath = path.join(__dirname, 'schema.sql');
    console.log(`📖 Reading schema file from: ${schemaPath}`);
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    console.log('🧹 Cleaning database schema (recreating public schema)...');
    await targetClient.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
    await targetClient.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');

    console.log('🔨 Executing schema SQL...');
    await targetClient.query(schemaSql);
    console.log('✅ Schema applied successfully.');

  } catch (err) {
    console.error('❌ Error applying schema:', err.message);
    await targetClient.end();
    process.exit(1);
  }

  await targetClient.end();
  console.log('🎉 Database setup complete!');
}

setup();
