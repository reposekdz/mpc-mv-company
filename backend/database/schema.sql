-- MOC-MV Company Ltd Database Schema
-- PostgreSQL version

-- Create database (run this separately if needed)
-- CREATE DATABASE mocmv_company;

-- Connect to database
-- \c mocmv_company;

-- Create custom types
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'viewer');
CREATE TYPE job_type AS ENUM ('mining', 'construction', 'maintenance', 'transport', 'other');
CREATE TYPE job_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');
CREATE TYPE job_priority AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE truck_type AS ENUM ('dump_truck', 'excavator', 'bulldozer', 'crane', 'loader', 'other');
CREATE TYPE truck_status AS ENUM ('available', 'in_use', 'maintenance', 'out_of_service');
CREATE TYPE employment_type AS ENUM ('full_time', 'part_time', 'contract', 'temporary');
CREATE TYPE employee_status AS ENUM ('active', 'on_leave', 'terminated', 'resigned');
CREATE TYPE salary_status AS ENUM ('pending', 'paid', 'cancelled');
CREATE TYPE report_type AS ENUM ('daily', 'weekly', 'monthly', 'incident', 'safety', 'equipment', 'other');
CREATE TYPE report_status AS ENUM ('draft', 'submitted', 'reviewed', 'approved', 'rejected');
CREATE TYPE meeting_status AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled');
CREATE TYPE consulting_status AS ENUM ('new', 'in_progress', 'completed', 'on_hold', 'cancelled');
CREATE TYPE consulting_priority AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE homework_status AS ENUM ('pending', 'in_progress', 'submitted', 'completed', 'late');
CREATE TYPE homework_priority AS ENUM ('low', 'medium', 'high');
CREATE TYPE contact_status AS ENUM ('new', 'read', 'replied', 'resolved');
CREATE TYPE service_type AS ENUM ('mining', 'construction', 'fleet', 'analytics', 'safety', 'consulting');
CREATE TYPE service_status AS ENUM ('new', 'contacted', 'quoted', 'in_progress', 'completed', 'rejected');

-- Users Table (Authentication)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role user_role DEFAULT 'viewer',
    avatar VARCHAR(255) NULL,
    phone VARCHAR(50) NULL,
    department VARCHAR(100) NULL,
    last_login TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Jobs Table
CREATE TABLE IF NOT EXISTS jobs (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    location VARCHAR(255) NOT NULL,
    type job_type NOT NULL,
    status job_status DEFAULT 'pending',
    priority job_priority DEFAULT 'medium',
    assigned_to INTEGER NULL,
    start_date TIMESTAMP NULL,
    end_date TIMESTAMP NULL,
    budget DECIMAL(15,2) DEFAULT 0,
    progress INTEGER DEFAULT 0,
    created_by INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Trucks / Fleet Table
CREATE TABLE IF NOT EXISTS trucks (
    id SERIAL PRIMARY KEY,
    plate_number VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    type truck_type NOT NULL,
    model VARCHAR(100) NULL,
    year INTEGER NULL,
    status truck_status DEFAULT 'available',
    current_location VARCHAR(255) NULL,
    driver_id INTEGER NULL,
    fuel_level DECIMAL(5,2) DEFAULT 100,
    mileage DECIMAL(12,2) DEFAULT 0,
    last_maintenance DATE NULL,
    next_maintenance DATE NULL,
    purchase_date DATE NULL,
    value DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Employees Table
CREATE TABLE IF NOT EXISTS employees (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(50) NULL,
    position VARCHAR(100) NOT NULL,
    department VARCHAR(100) NOT NULL,
    salary DECIMAL(12,2) NOT NULL,
    hourly_rate DECIMAL(8,2) NOT NULL,
    hire_date DATE NOT NULL,
    employment_type employment_type DEFAULT 'full_time',
    status employee_status DEFAULT 'active',
    address TEXT NULL,
    emergency_contact VARCHAR(255) NULL,
    emergency_phone VARCHAR(50) NULL,
    date_of_birth DATE NULL,
    national_id VARCHAR(100) NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Salaries Table
CREATE TABLE IF NOT EXISTS salaries (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_month INTEGER NOT NULL,
    payment_year INTEGER NOT NULL,
    status salary_status DEFAULT 'pending',
    deductions DECIMAL(12,2) DEFAULT 0,
    bonuses DECIMAL(12,2) DEFAULT 0,
    net_amount DECIMAL(12,2) NOT NULL,
    paid_by INTEGER NULL,
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (paid_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Reports Table
CREATE TABLE IF NOT EXISTS reports (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    type report_type NOT NULL,
    status report_status DEFAULT 'draft',
    job_id VARCHAR(36) NULL,
    submitted_by INTEGER NOT NULL,
    reviewed_by INTEGER NULL,
    submitted_at TIMESTAMP NULL,
    reviewed_at TIMESTAMP NULL,
    attachments JSONB NULL,
    metadata JSONB NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (submitted_by) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Meetings Table
CREATE TABLE IF NOT EXISTS meetings (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    organizer_id INTEGER NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    location VARCHAR(255) NULL,
    is_virtual BOOLEAN DEFAULT false,
    virtual_link VARCHAR(255) NULL,
    attendees JSONB NULL,
    status meeting_status DEFAULT 'scheduled',
    agenda TEXT NULL,
    minutes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organizer_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Consulting Topics Table
CREATE TABLE IF NOT EXISTS consulting_topics (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    client_name VARCHAR(255) NOT NULL,
    client_email VARCHAR(255) NULL,
    client_phone VARCHAR(50) NULL,
    status consulting_status DEFAULT 'new',
    priority consulting_priority DEFAULT 'medium',
    assigned_to INTEGER NULL,
    estimated_hours DECIMAL(10,2) DEFAULT 0,
    actual_hours DECIMAL(10,2) DEFAULT 0,
    budget DECIMAL(15,2) DEFAULT 0,
    start_date DATE NULL,
    end_date DATE NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
);

-- Analytics Data Table
CREATE TABLE IF NOT EXISTS analytics_data (
    id SERIAL PRIMARY KEY,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(18,4) NOT NULL,
    metric_date DATE NOT NULL,
    category VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100) NULL,
    metadata JSONB NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (metric_name, metric_date, category)
);

-- Homework / Assignments Table
CREATE TABLE IF NOT EXISTS homework (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    assigned_to INTEGER NOT NULL,
    assigned_by INTEGER NOT NULL,
    due_date TIMESTAMP NOT NULL,
    status homework_status DEFAULT 'pending',
    priority homework_priority DEFAULT 'medium',
    attachments JSONB NULL,
    grade DECIMAL(5,2) NULL,
    feedback TEXT NULL,
    submitted_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Contact Messages Table (from welcome page)
CREATE TABLE IF NOT EXISTS contact_messages (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NULL,
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status contact_status DEFAULT 'new',
    assigned_to INTEGER NULL,
    replied_at TIMESTAMP NULL,
    reply_text TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
);

-- Service Requests Table
CREATE TABLE IF NOT EXISTS service_requests (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    company VARCHAR(255) NULL,
    phone VARCHAR(50) NULL,
    service_type service_type NOT NULL,
    requirements TEXT NOT NULL,
    budget_range VARCHAR(100) NULL,
    timeline VARCHAR(100) NULL,
    status service_status DEFAULT 'new',
    assigned_to INTEGER NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_type ON jobs(type);
CREATE INDEX IF NOT EXISTS idx_trucks_status ON trucks(status);
CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department);
CREATE INDEX IF NOT EXISTS idx_salaries_date ON salaries(payment_year, payment_month);
CREATE INDEX IF NOT EXISTS idx_reports_type ON reports(type);
CREATE INDEX IF NOT EXISTS idx_meetings_date ON meetings(start_time);
CREATE INDEX IF NOT EXISTS idx_consulting_status ON consulting_topics(status);
CREATE INDEX IF NOT EXISTS idx_analytics_date ON analytics_data(metric_date);
CREATE INDEX IF NOT EXISTS idx_contact_status ON contact_messages(status);
CREATE INDEX IF NOT EXISTS idx_service_requests_status ON service_requests(status);

-- ─── Backfill columns added after the original schema (idempotent) ───
ALTER TABLE meetings  ADD COLUMN IF NOT EXISTS date            DATE;
ALTER TABLE meetings  ADD COLUMN IF NOT EXISTS priority        VARCHAR(20)  DEFAULT 'medium';
ALTER TABLE meetings  ADD COLUMN IF NOT EXISTS organizer_name  VARCHAR(255);
ALTER TABLE meetings  ADD COLUMN IF NOT EXISTS notes           TEXT;
ALTER TABLE meetings  ADD COLUMN IF NOT EXISTS online_link     VARCHAR(500);

ALTER TABLE reports   ADD COLUMN IF NOT EXISTS summary         TEXT;
ALTER TABLE reports   ADD COLUMN IF NOT EXISTS content         TEXT;
ALTER TABLE reports   ADD COLUMN IF NOT EXISTS author          VARCHAR(255);
ALTER TABLE reports   ADD COLUMN IF NOT EXISTS period_start    DATE;
ALTER TABLE reports   ADD COLUMN IF NOT EXISTS period_end      DATE;