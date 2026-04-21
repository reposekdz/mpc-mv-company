-- MOC-MV Company Ltd Database Schema
-- Created for MySQL 8.0+

CREATE DATABASE IF NOT EXISTS mocmv_company;
USE mocmv_company;

-- Users Table (Authentication)
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'manager', 'viewer') DEFAULT 'viewer',
    avatar VARCHAR(255) NULL,
    phone VARCHAR(50) NULL,
    department VARCHAR(100) NULL,
    last_login DATETIME NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Jobs Table
CREATE TABLE IF NOT EXISTS jobs (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    location VARCHAR(255) NOT NULL,
    type ENUM('mining', 'construction', 'maintenance', 'transport', 'other') NOT NULL,
    status ENUM('pending', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending',
    priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    assigned_to INT NULL,
    start_date DATETIME NULL,
    end_date DATETIME NULL,
    budget DECIMAL(15,2) DEFAULT 0,
    progress INT DEFAULT 0,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Trucks / Fleet Table
CREATE TABLE IF NOT EXISTS trucks (
    id INT PRIMARY KEY AUTO_INCREMENT,
    plate_number VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    type ENUM('dump_truck', 'excavator', 'bulldozer', 'crane', 'loader', 'other') NOT NULL,
    model VARCHAR(100) NULL,
    year INT NULL,
    status ENUM('available', 'in_use', 'maintenance', 'out_of_service') DEFAULT 'available',
    current_location VARCHAR(255) NULL,
    driver_id INT NULL,
    fuel_level DECIMAL(5,2) DEFAULT 100,
    mileage DECIMAL(12,2) DEFAULT 0,
    last_maintenance DATE NULL,
    next_maintenance DATE NULL,
    purchase_date DATE NULL,
    value DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Employees Table
CREATE TABLE IF NOT EXISTS employees (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(50) NULL,
    position VARCHAR(100) NOT NULL,
    department VARCHAR(100) NOT NULL,
    salary DECIMAL(12,2) NOT NULL,
    hourly_rate DECIMAL(8,2) NOT NULL,
    hire_date DATE NOT NULL,
    employment_type ENUM('full_time', 'part_time', 'contract', 'temporary') DEFAULT 'full_time',
    status ENUM('active', 'on_leave', 'terminated', 'resigned') DEFAULT 'active',
    address TEXT NULL,
    emergency_contact VARCHAR(255) NULL,
    emergency_phone VARCHAR(50) NULL,
    date_of_birth DATE NULL,
    national_id VARCHAR(100) NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Salaries Table
CREATE TABLE IF NOT EXISTS salaries (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_month INT NOT NULL,
    payment_year INT NOT NULL,
    status ENUM('pending', 'paid', 'cancelled') DEFAULT 'pending',
    deductions DECIMAL(12,2) DEFAULT 0,
    bonuses DECIMAL(12,2) DEFAULT 0,
    net_amount DECIMAL(12,2) NOT NULL,
    paid_by INT NULL,
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (paid_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Reports Table
CREATE TABLE IF NOT EXISTS reports (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    type ENUM('daily', 'weekly', 'monthly', 'incident', 'safety', 'equipment', 'other') NOT NULL,
    status ENUM('draft', 'submitted', 'reviewed', 'approved', 'rejected') DEFAULT 'draft',
    job_id VARCHAR(36) NULL,
    submitted_by INT NOT NULL,
    reviewed_by INT NULL,
    submitted_at TIMESTAMP NULL,
    reviewed_at TIMESTAMP NULL,
    attachments JSON NULL,
    metadata JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    -- FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE SET NULL,
    FOREIGN KEY (submitted_by) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Meetings Table
CREATE TABLE IF NOT EXISTS meetings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    organizer_id INT NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    location VARCHAR(255) NULL,
    is_virtual BOOLEAN DEFAULT false,
    virtual_link VARCHAR(255) NULL,
    attendees JSON NULL,
    status ENUM('scheduled', 'in_progress', 'completed', 'cancelled') DEFAULT 'scheduled',
    agenda TEXT NULL,
    minutes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (organizer_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Consulting Topics Table
CREATE TABLE IF NOT EXISTS consulting_topics (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    client_name VARCHAR(255) NOT NULL,
    client_email VARCHAR(255) NULL,
    client_phone VARCHAR(50) NULL,
    status ENUM('new', 'in_progress', 'completed', 'on_hold', 'cancelled') DEFAULT 'new',
    priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    assigned_to INT NULL,
    estimated_hours DECIMAL(10,2) DEFAULT 0,
    actual_hours DECIMAL(10,2) DEFAULT 0,
    budget DECIMAL(15,2) DEFAULT 0,
    start_date DATE NULL,
    end_date DATE NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
);

-- Analytics Data Table
CREATE TABLE IF NOT EXISTS analytics_data (
    id INT PRIMARY KEY AUTO_INCREMENT,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(18,4) NOT NULL,
    metric_date DATE NOT NULL,
    category VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100) NULL,
    metadata JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_metric_date (metric_name, metric_date, category)
);

-- Homework / Assignments Table
CREATE TABLE IF NOT EXISTS homework (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    assigned_to INT NOT NULL,
    assigned_by INT NOT NULL,
    due_date DATETIME NOT NULL,
    status ENUM('pending', 'in_progress', 'submitted', 'completed', 'late') DEFAULT 'pending',
    priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
    attachments JSON NULL,
    grade DECIMAL(5,2) NULL,
    feedback TEXT NULL,
    submitted_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Contact Messages Table (from welcome page)
CREATE TABLE IF NOT EXISTS contact_messages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NULL,
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status ENUM('new', 'read', 'replied', 'resolved') DEFAULT 'new',
    assigned_to INT NULL,
    replied_at TIMESTAMP NULL,
    reply_text TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
);

-- Service Requests Table
CREATE TABLE IF NOT EXISTS service_requests (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    company VARCHAR(255) NULL,
    phone VARCHAR(50) NULL,
    service_type ENUM('mining', 'construction', 'fleet', 'analytics', 'safety', 'consulting') NOT NULL,
    requirements TEXT NOT NULL,
    budget_range VARCHAR(100) NULL,
    timeline VARCHAR(100) NULL,
    status ENUM('new', 'contacted', 'quoted', 'in_progress', 'completed', 'rejected') DEFAULT 'new',
    assigned_to INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
);

-- Create indexes for performance
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_type ON jobs(type);
CREATE INDEX idx_trucks_status ON trucks(status);
CREATE INDEX idx_employees_department ON employees(department);
CREATE INDEX idx_salaries_date ON salaries(payment_year, payment_month);
CREATE INDEX idx_reports_type ON reports(type);
CREATE INDEX idx_meetings_date ON meetings(start_time);
CREATE INDEX idx_consulting_status ON consulting_topics(status);
CREATE INDEX idx_analytics_date ON analytics_data(metric_date);
CREATE INDEX idx_contact_status ON contact_messages(status);
CREATE INDEX idx_service_requests_status ON service_requests(status);
