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

async function init() {
  const targetDb = process.env.DB_NAME || 'ems_db';
  console.log(`🔄 Checking/Creating target database: "${targetDb}"...`);

  // 1. Connect to default 'postgres' database to ensure target exists
  const defaultClient = new Client({
    ...dbConfig,
    database: 'postgres',
  });

  try {
    await defaultClient.connect();
    const res = await defaultClient.query('SELECT 1 FROM pg_database WHERE datname = $1', [targetDb]);
    if (res.rowCount === 0) {
      console.log(`🔨 Creating database "${targetDb}"...`);
      await defaultClient.query(`CREATE DATABASE ${targetDb}`);
      console.log(`✅ Database "${targetDb}" created.`);
    } else {
      console.log(`ℹ️ Database "${targetDb}" already exists.`);
    }
  } catch (err) {
    console.error('❌ Database connection/creation failed:', err.message);
    process.exit(1);
  } finally {
    await defaultClient.end();
  }

  // 2. Connect to the target database
  const client = new Client({
    ...dbConfig,
    database: targetDb,
  });

  try {
    await client.connect();

    // Check if tables already exist by checking if 'tenants' table exists
    const tableCheck = await client.query(`
      SELECT COUNT(*)::int AS count 
      FROM pg_tables 
      WHERE schemaname = 'public' AND tablename = 'tenants'
    `);

    if (tableCheck.rows[0].count === 0) {
      console.log('📖 Table "tenants" not found. Applying database schema...');
      const schemaPath = path.join(__dirname, 'schema.sql');
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      await client.query(schemaSql);
      console.log('✅ Database schema applied successfully.');
    } else {
      console.log('ℹ️ Database schema already applied.');
    }

    console.log('🎉 Production database setup successfully complete!');
    console.log('');
    console.log('ℹ️  With Clerk authentication, users and organizations are created');
    console.log('    automatically when they first access the API.');
    console.log('    No manual admin user creation is needed.');
  } catch (err) {
    console.error('❌ Error during production database initialization:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

init();
