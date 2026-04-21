const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
  console.log('Starting database migration...');

  try {
    // Connect to MySQL server (without database first)
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      multipleStatements: true
    });

    console.log('Connected to MySQL server successfully');

    // Read and execute schema
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    console.log('Executing schema...');
    await connection.query(schemaSql);
    console.log('✅ Schema created successfully');

    // Close connection and reconnect to specific database
    await connection.end();

    const dbConnection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'mocmv_company',
      multipleStatements: true
    });

    // Read and execute seed data
    const seedSql = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8');
    console.log('Executing seed data...');
    await dbConnection.query(seedSql);
    console.log('✅ Seed data inserted successfully');

    await dbConnection.end();
    
    console.log('\n🎉 Migration completed successfully!');
    console.log('\nDatabase: mocmv_company');
    console.log('Default admin user: admin@mocmv.com');
    console.log('Default password: admin123');
    console.log('\nYou can now start the backend server with: npm run dev');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();
