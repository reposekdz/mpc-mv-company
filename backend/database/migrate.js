const { Client } = require('pg');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
  console.log('Starting PostgreSQL database migration...');
  
  let dbClient;
  
  try {
    if (process.env.DATABASE_URL) {
      console.log('Using Render PostgreSQL connection...');
      dbClient = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: {
          rejectUnauthorized: false
        }
      });
    } else {
      console.log('Using local PostgreSQL connection...');
      const client = new Client({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'password',
        port: process.env.DB_PORT || 5432,
      });
      
      await client.connect();
      console.log('Connected to PostgreSQL server successfully');
      
      const dbName = process.env.DB_NAME || 'mocmv_company';
      try {
        await client.query(`CREATE DATABASE ${dbName}`);
        console.log(`✅ Database '${dbName}' created`);
      } catch (e) {
        if (e.code === '42P04') {
          console.log(`✅ Database '${dbName}' already exists`);
        } else {
          throw e;
        }
      }
      
      await client.end();
      
      dbClient = new Client({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'password',
        database: dbName,
        port: process.env.DB_PORT || 5432,
      });
    }

    await dbClient.connect();
    console.log('Connected to target database successfully');

    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    console.log('Executing schema...');
    
    const statements = schemaSql
      .replace(/\r\n/g, '\n')
      .split(/;\s*$/m)
      .filter(stmt => stmt.trim().length > 0);
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await dbClient.query(statement);
        } catch (e) {
          if (e.code !== '42P07' && e.code !== '42710') {
            console.warn(`⚠️  Warning in statement: ${e.message}`);
          }
        }
      }
    }
    console.log('✅ Schema created/verified successfully');

    const seedSql = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8');
    console.log('Executing seed data...');
    
    const seedStatements = seedSql
      .replace(/\r\n/g, '\n')
      .split(/;\s*$/m)
      .filter(stmt => stmt.trim().length > 0);
    
    for (const statement of seedStatements) {
      if (statement.trim()) {
        try {
          await dbClient.query(statement);
        } catch (e) {
          if (e.code !== '23505') {
            console.warn(`⚠️  Seed warning: ${e.message}`);
          }
        }
      }
    }
    console.log('✅ Seed data inserted/verified successfully');

    // ─── Ensure admin/manager passwords always match Admin@123 (idempotent) ───
    const defaultPassword = process.env.SEED_DEFAULT_PASSWORD || 'Admin@123';
    const hash = await bcrypt.hash(defaultPassword, 10);
    const seededEmails = [
      'admin@mocmv.com',
      'manager@mocmv.com',
      'viewer@mocmv.com',
      'mike@mocmv.com',
      'lisa@mocmv.com',
    ];
    for (const email of seededEmails) {
      await dbClient.query(
        'UPDATE users SET password_hash = $1, is_active = true WHERE email = $2',
        [hash, email]
      );
    }
    console.log(`✅ Reset password for ${seededEmails.length} seed users to "${defaultPassword}"`);

    // ─── Idempotent enum extensions used by the frontend ────────────────────
    const enumPatches = [
      { type: 'report_type', value: 'financial' },
      { type: 'report_type', value: 'operational' },
      { type: 'report_type', value: 'performance' },
    ];
    for (const { type, value } of enumPatches) {
      try {
        await dbClient.query(`ALTER TYPE ${type} ADD VALUE IF NOT EXISTS '${value}'`);
      } catch (e) {
        // PG <12 doesn't support IF NOT EXISTS; ignore if value already exists.
        if (!/already exists/i.test(e.message || '')) {
          console.warn(`⚠️  enum patch ${type}.${value}: ${e.message}`);
        }
      }
    }
    console.log('✅ Enum patches applied');

    await dbClient.end();

    console.log('\n🎉 Migration completed successfully!');
    console.log('\n✅ Database is ready for production use');
    console.log('Default admin user: admin@mocmv.com');
    console.log(`Default password: ${defaultPassword}`);

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    if (dbClient) await dbClient.end();
    process.exit(1);
  }
}

runMigration();
