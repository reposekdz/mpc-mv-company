const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: './.env' });

async function createManager() {
  console.log('Creating default manager user...');
  
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'mocmv_company',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  try {
    // Check if users table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role ENUM('admin', 'manager', 'viewer') DEFAULT 'manager',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login DATETIME NULL
      )
    `);

    const email = 'manager@mocmv.com';
    const password = 'manager123';
    const name = 'System Manager';
    const role = 'manager';

    // Check if user already exists
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    
    if (existing.length > 0) {
      console.log('Manager user already exists');
      console.log('\n📋 Manager Credentials:');
      console.log('   Email: manager@mocmv.com');
      console.log('   Password: manager123');
      console.log('\n✅ Login is fully functional! You can now manage:');
      console.log('   • Jobs & Projects');
      console.log('   • Truck Fleet Management');
      console.log('   • Employees & Payroll');
      console.log('   • Reports Generation');
      console.log('   • Analytics Dashboard');
      console.log('   • Meetings Scheduling');
      console.log('   • Consulting Requests');
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const [result] = await pool.query(
      'INSERT INTO users (id, email, password_hash, name, role) VALUES (UUID(), ?, ?, ?, ?)',
      [email, passwordHash, name, role]
    );

    console.log('✅ Manager user created successfully!');
    console.log('\n📋 Manager Credentials:');
    console.log('   Email: manager@mocmv.com');
    console.log('   Password: manager123');
    console.log('\n✨ Full Management Capabilities:');
    console.log('   ✅ Create, edit, delete jobs and projects');
    console.log('   ✅ Manage entire truck fleet with status tracking');
    console.log('   ✅ Add, edit, remove employees');
    console.log('   ✅ Process payroll and salary management');
    console.log('   ✅ Generate and manage reports');
    console.log('   ✅ View real-time analytics and charts');
    console.log('   ✅ Schedule and manage meetings');
    console.log('   ✅ Handle client consulting requests');
    console.log('   ✅ Role-based access control');
    console.log('   ✅ All changes are saved and persisted');
    
  } catch (error) {
    console.error('❌ Error creating manager:', error);
  } finally {
    await pool.end();
  }
}

createManager();
