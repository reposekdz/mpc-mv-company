-- MOC-MV Company Ltd Database Schema
-- MySQL Database for Mining & Construction Management System

SET FOREIGN_KEY_CHECKS=0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

-- Create Database
CREATE DATABASE IF NOT EXISTS `mocmv_company` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `mocmv_company`;

-- Users Table for Authentication
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `email` VARCHAR(255) UNIQUE NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `role` ENUM('admin', 'manager', 'viewer') DEFAULT 'manager',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Jobs Table (Mining & Construction Projects)
CREATE TABLE IF NOT EXISTS `jobs` (
  `id` VARCHAR(50) PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `status` ENUM('pending', 'in_progress', 'completed', 'on_hold', 'cancelled') DEFAULT 'pending',
  `priority` ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
  `assigned_to` VARCHAR(255),
  `location` VARCHAR(255) NOT NULL,
  `start_date` DATE,
  `end_date` DATE,
  `budget` DECIMAL(15,2) DEFAULT 0,
  `progress` TINYINT UNSIGNED DEFAULT 0,
  `type` ENUM('mining', 'construction') NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_status` (`status`),
  INDEX `idx_type` (`type`),
  INDEX `idx_assigned` (`assigned_to`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Trucks Table (Fleet Management)
CREATE TABLE IF NOT EXISTS `trucks` (
  `id` VARCHAR(50) PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `plate_number` VARCHAR(50) UNIQUE NOT NULL,
  `model` VARCHAR(255),
  `year` INT UNSIGNED,
  `status` ENUM('available', 'in_use', 'maintenance', 'out_of_service') DEFAULT 'available',
  `driver` VARCHAR(255),
  `assigned_job` VARCHAR(255),
  `fuel_level` TINYINT UNSIGNED DEFAULT 100,
  `mileage` INT UNSIGNED DEFAULT 0,
  `last_maintenance` DATE,
  `next_maintenance` DATE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_status` (`status`),
  INDEX `idx_driver` (`driver`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Employees Table (Payroll)
CREATE TABLE IF NOT EXISTS `employees` (
  `id` VARCHAR(50) PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `role` VARCHAR(255) NOT NULL,
  `department` VARCHAR(255) NOT NULL,
  `base_salary` DECIMAL(10,2) NOT NULL,
  `deductions` DECIMAL(10,2) DEFAULT 0,
  `bonuses` DECIMAL(10,2) DEFAULT 0,
  `net_pay` DECIMAL(10,2) GENERATED ALWAYS AS (base_salary - deductions + bonuses) STORED,
  `payment_status` ENUM('paid', 'pending', 'overdue') DEFAULT 'pending',
  `payment_date` DATE,
  `pay_period` ENUM('monthly', 'weekly') DEFAULT 'monthly',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_department` (`department`),
  INDEX `idx_payment_status` (`payment_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Reports Table
CREATE TABLE IF NOT EXISTS `reports` (
  `id` VARCHAR(50) PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `type` ENUM('financial', 'operational', 'safety', 'performance') NOT NULL,
  `date` DATE NOT NULL,
  `status` ENUM('draft', 'published') DEFAULT 'draft',
  `summary` TEXT,
  `author` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_type` (`type`),
  INDEX `idx_status` (`status`),
  INDEX `idx_date` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Consulting Topics Table (Internal Discussions)
CREATE TABLE IF NOT EXISTS `consulting_topics` (
  `id` VARCHAR(50) PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NOT NULL,
  `author` VARCHAR(255) NOT NULL,
  `date` DATE NOT NULL,
  `category` ENUM('performance', 'strategy', 'operations', 'finance') NOT NULL,
  `status` ENUM('open', 'resolved', 'in_discussion') DEFAULT 'open',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_category` (`category`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Consulting Replies Table
CREATE TABLE IF NOT EXISTS `consulting_replies` (
  `id` VARCHAR(50) PRIMARY KEY,
  `topic_id` VARCHAR(50) NOT NULL,
  `author` VARCHAR(255) NOT NULL,
  `content` TEXT NOT NULL,
  `date` DATE NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`topic_id`) REFERENCES `consulting_topics`(`id`) ON DELETE CASCADE,
  INDEX `idx_topic` (`topic_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Meetings Table
CREATE TABLE IF NOT EXISTS `meetings` (
  `id` VARCHAR(50) PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `date` DATE NOT NULL,
  `start_time` TIME NOT NULL,
  `end_time` TIME NOT NULL,
  `location` VARCHAR(255) NOT NULL,
  `organizer` VARCHAR(255) NOT NULL,
  `attendees` JSON NOT NULL,
  `status` ENUM('scheduled', 'in_progress', 'completed', 'cancelled') DEFAULT 'scheduled',
  `priority` ENUM('normal', 'important', 'urgent') DEFAULT 'normal',
  `notes` TEXT,
  `agenda` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_status` (`status`),
  INDEX `idx_date` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Analytics Data Table (Monthly aggregated data)
CREATE TABLE IF NOT EXISTS `analytics_data` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `month` VARCHAR(20) NOT NULL,
  `revenue` DECIMAL(15,2) DEFAULT 0,
  `expenses` DECIMAL(15,2) DEFAULT 0,
  `profit` DECIMAL(15,2) DEFAULT 0,
  `jobs_completed` INT UNSIGNED DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_month` (`month`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sessions Table for JWT token management (optional blacklist)
CREATE TABLE IF NOT EXISTS `blacklisted_tokens` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `token` VARCHAR(512) NOT NULL,
  `expires_at` TIMESTAMP NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_token` (`token`(255)),
  INDEX `idx_expires` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Settings Table for system configuration
CREATE TABLE IF NOT EXISTS `settings` (
  `key` VARCHAR(100) PRIMARY KEY,
  `value` TEXT NOT NULL,
  `description` VARCHAR(255),
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default admin user (password: admin123456 - hashed in actual implementation)
-- Note: In production, passwords must be properly hashed with bcrypt
INSERT INTO `users` (`email`, `password_hash`, `name`, `role`) VALUES
('manager@gmail.com', '$2a$10$NlGk8Q6Z7Y8X9W0V1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0U1V2W', 'System Manager', 'admin')
ON DUPLICATE KEY UPDATE `name`='System Manager', `role`='admin';

-- Insert sample analytics data for past 7 months
INSERT INTO `analytics_data` (`month`, `revenue`, `expenses`, `profit`, `jobs_completed`) VALUES
('Oct', 980000, 780000, 200000, 2),
('Nov', 1150000, 890000, 260000, 3),
('Dec', 1320000, 950000, 370000, 2),
('Jan', 1450000, 1050000, 400000, 4),
('Feb', 1280000, 920000, 360000, 3),
('Mar', 1680000, 1180000, 500000, 5),
('Apr', 1520000, 1090000, 430000, 4)
ON DUPLICATE KEY UPDATE `revenue`=VALUES(`revenue`), `expenses`=VALUES(`expenses`), `profit`=VALUES(`profit`), `jobs_completed`=VALUES(`jobs_completed`);

SET FOREIGN_KEY_CHECKS=1;
