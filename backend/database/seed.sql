-- Seed data for MOC-MV Company Ltd database

USE mocmv_company;

-- Default admin user (password: admin123)
INSERT INTO users (name, email, password_hash, role, department, phone, is_active) VALUES
('Administrator', 'admin@mocmv.com', '$2a$10$EixZaY3ZnV2Dc69p8/.e9eH3G9a3Vv2l5Uj7Q8l9Uv7I6X7Z5Y7W6', 'admin', 'Management', '+250 788 123 456', true),
('John Manager', 'manager@mocmv.com', '$2a$10$EixZaY3ZnV2Dc69p8/.e9eH3G9a3Vv2l5Uj7Q8l9Uv7I6X7Z5Y7W6', 'manager', 'Operations', '+250 788 123 457', true),
('Sarah Viewer', 'viewer@mocmv.com', '$2a$10$EixZaY3ZnV2Dc69p8/.e9eH3G9a3Vv2l5Uj7Q8l9Uv7I6X7Z5Y7W6', 'viewer', 'Safety', '+250 788 123 458', true),
('Mike Driver', 'mike@mocmv.com', '$2a$10$EixZaY3ZnV2Dc69p8/.e9eH3G9a3Vv2l5Uj7Q8l9Uv7I6X7Z5Y7W6', 'viewer', 'Fleet', '+250 788 123 459', true),
('Lisa Engineer', 'lisa@mocmv.com', '$2a$10$EixZaY3ZnV2Dc69p8/.e9eH3G9a3Vv2l5Uj7Q8l9Uv7I6X7Z5Y7W6', 'manager', 'Engineering', '+250 788 123 460', true);

-- Seed employees
INSERT INTO employees (user_id, first_name, last_name, email, phone, position, department, salary, hourly_rate, hire_date, employment_type, status) VALUES
(1, 'Administrator', 'Admin', 'admin@mocmv.com', '+250 788 123 456', 'System Administrator', 'Management', 1500000.00, 7500.00, '2023-01-15', 'full_time', 'active'),
(2, 'John', 'Manager', 'manager@mocmv.com', '+250 788 123 457', 'Operations Manager', 'Operations', 1200000.00, 6000.00, '2023-02-20', 'full_time', 'active'),
(4, 'Mike', 'Driver', 'mike@mocmv.com', '+250 788 123 459', 'Senior Driver', 'Fleet', 800000.00, 4000.00, '2023-03-10', 'full_time', 'active'),
(5, 'Lisa', 'Engineer', 'lisa@mocmv.com', '+250 788 123 460', 'Civil Engineer', 'Engineering', 1100000.00, 5500.00, '2023-04-05', 'full_time', 'active'),
(NULL, 'David', 'Kimenyi', 'david@mocmv.com', '+250 788 123 461', 'Mining Supervisor', 'Mining', 900000.00, 4500.00, '2023-05-12', 'full_time', 'active'),
(NULL, 'Jane', 'Mukamana', 'jane@mocmv.com', '+250 788 123 462', 'Safety Officer', 'Safety', 750000.00, 3750.00, '2023-06-18', 'full_time', 'active'),
(NULL, 'Peter', 'Ndayisaba', 'peter@mocmv.com', '+250 788 123 463', 'Mechanic', 'Maintenance', 650000.00, 3250.00, '2023-07-22', 'full_time', 'active'),
(NULL, 'Mary', 'Uwase', 'mary@mocmv.com', '+250 788 123 464', 'Accountant', 'Finance', 850000.00, 4250.00, '2023-08-30', 'full_time', 'active');

-- Seed trucks
INSERT INTO trucks (plate_number, name, type, model, year, status, current_location, fuel_level, mileage, last_maintenance) VALUES
('RAB 123 A', 'Dump Truck 01', 'dump_truck', 'Volvo FMX', 2020, 'available', 'Kigali Main Yard', 85.5, 125600.50, '2026-03-15'),
('RAB 124 B', 'Excavator 01', 'excavator', 'CAT 320D', 2019, 'in_use', 'Nyagatare Mining Site', 65.0, 89400.25, '2026-03-20'),
('RAB 125 C', 'Bulldozer 01', 'bulldozer', 'Komatsu D65', 2021, 'available', 'Kigali Main Yard', 95.0, 45200.75, '2026-04-01'),
('RAB 126 D', 'Crane 01', 'crane', 'Liebherr LTM', 2018, 'maintenance', 'Kigali Workshop', 30.0, 78500.00, '2026-02-28'),
('RAB 127 E', 'Loader 01', 'loader', 'Volvo L150', 2022, 'available', 'Musanze Construction Site', 75.0, 32100.50, '2026-03-25'),
('RAB 128 F', 'Dump Truck 02', 'dump_truck', 'Scania P410', 2021, 'in_use', 'Nyagatare Mining Site', 50.0, 98700.00, '2026-03-18'),
('RAB 129 G', 'Excavator 02', 'excavator', 'Hitachi ZX200', 2020, 'available', 'Kigali Main Yard', 90.0, 67800.25, '2026-04-05'),
('RAB 130 H', 'Service Truck', 'other', 'Isuzu NQR', 2019, 'available', 'Kigali Main Yard', 100.0, 112500.00, '2026-03-30');

-- Seed jobs
INSERT INTO jobs (id, title, description, location, type, status, priority, assigned_to, start_date, end_date, budget, progress, created_by) VALUES
('job-001', 'Nyagatare Gold Mining Phase 1', 'Gold extraction operations at Nyagatare site. Includes drilling, blasting, and ore processing.', 'Nyagatare, Eastern Province', 'mining', 'in_progress', 'high', 5, '2026-04-01', '2026-06-30', 50000000, 37, 1),
('job-002', 'Kigali Convention Center Extension', 'Construction of additional conference facilities and parking garage.', 'Kigali, Nyarugenge', 'construction', 'in_progress', 'high', 2, '2026-03-15', '2026-07-30', 35000000, 40, 1),
('job-003', 'Fleet Maintenance Program Q2', 'Quarterly maintenance for all heavy equipment including oil changes, filter replacements, and system checks.', 'Kigali Workshop', 'maintenance', 'pending', 'medium', 4, '2026-04-15', '2026-04-30', 5000000, 0, 2),
('job-004', 'Rubavu Road Construction', 'Asphalt road paving for 5km stretch in Rubavu district.', 'Rubavu, Western Province', 'construction', 'pending', 'medium', NULL, '2026-05-01', '2026-06-15', 25000000, 0, 2),
('job-005', 'Musanze Quarry Development', 'Develop new quarry site for construction aggregate production.', 'Musanze, Northern Province', 'mining', 'completed', 'high', 5, '2026-01-10', '2026-03-20', 20000000, 100, 1);

-- Seed reports
INSERT INTO reports (title, description, type, status, job_id, submitted_by, reviewed_by, submitted_at, reviewed_at) VALUES
('Daily Mining Report - 20/04', 'Production output: 450 tons ore processed. Equipment utilization 92%. No safety incidents.', 'daily', 'approved', 'job-001', 5, 2, '2026-04-20 18:00:00', '2026-04-20 19:30:00'),
('Weekly Safety Report', 'All safety protocols followed. Toolbox talks completed for all shifts. 0 incidents reported this week.', 'safety', 'reviewed', NULL, 5, 2, '2026-04-19 16:00:00', '2026-04-20 09:00:00'),
('Equipment Maintenance Log', 'Regular maintenance completed for trucks RAB123 and RAB125. Hydraulic system check performed.', 'equipment', 'submitted', NULL, 4, NULL, '2026-04-18 14:00:00', NULL),
('Monthly Production Summary March', 'Total production 12,500 tons. 95% of target achieved. Revenue: RWF 125M.', 'monthly', 'approved', NULL, 1, 1, '2026-04-05 10:00:00', '2026-04-05 14:00:00'),
('Incident Report - Minor Equipment Damage', 'Minor scratch on excavator bucket. No injuries. Root cause: operator training gap.', 'incident', 'approved', 'job-002', 5, 1, '2026-04-15 11:00:00', '2026-04-15 15:00:00');

-- Seed meetings
INSERT INTO meetings (title, description, organizer_id, start_time, end_time, location, is_virtual, status, attendees) VALUES
('Daily Morning Huddle', 'Daily team briefing to review progress and plan day\'s activities.', 1, '2026-04-22 08:00:00', '2026-04-22 08:30:00', 'Conference Room A', false, 'scheduled', '[2,4,5,6]'),
('Safety Committee Meeting', 'Monthly safety review and incident analysis.', 6, '2026-04-25 10:00:00', '2026-04-25 12:00:00', 'Zoom Meeting', true, 'scheduled', '[1,2,5,6,7]'),
('Project Review - Nyagatare Mining', 'Progress review for Phase 1 mining operations.', 2, '2026-04-23 14:00:00', '2026-04-23 16:00:00', 'Conference Room B', false, 'scheduled', '[1,5,7]'),
('Budget Planning Q2', 'Quarterly budget allocation and financial planning session.', 8, '2026-04-28 09:00:00', '2026-04-28 12:00:00', 'Board Room', false, 'scheduled', '[1,2,8]'),
('Completed - Fleet Status Review', 'Past fleet status review meeting.', 4, '2026-04-18 11:00:00', '2026-04-18 12:30:00', 'Workshop', false, 'completed', '[2,4,7]');

-- Seed consulting topics
INSERT INTO consulting_topics (title, description, client_name, client_email, client_phone, status, priority, assigned_to, estimated_hours, budget, start_date) VALUES
('Mining Feasibility Study', 'Complete feasibility study for coltan mining operation in Western Province.', 'Rwanda Mining Group', 'info@rwandamining.rw', '+250 788 987 654', 'in_progress', 'high', 5, 120, 15000000, '2026-04-10'),
('Construction Quality Audit', 'Third-party quality audit for commercial building project in Kigali.', 'Prime Real Estate', 'projects@primere.rw', '+250 788 987 655', 'new', 'medium', NULL, 40, 5000000, NULL),
('Safety Management System', 'Development of comprehensive workplace safety management system.', 'East Africa Contractors', 'safety@eacontractors.com', '+250 788 987 656', 'new', 'high', 6, 80, 8000000, NULL),
('Fleet Optimization Consulting', 'Analysis and recommendations for fleet efficiency improvements.', 'Trans Cargo Ltd', 'operations@transcargo.rw', '+250 788 987 657', 'completed', 'medium', 4, 60, 6000000, '2026-03-01');

-- Seed analytics data
INSERT INTO analytics_data (metric_name, metric_value, metric_date, category, subcategory) VALUES
('total_revenue', 125000000.00, '2026-03-31', 'financial', 'monthly'),
('total_expenses', 85000000.00, '2026-03-31', 'financial', 'monthly'),
('ore_produced', 12500.00, '2026-03-31', 'production', 'mining'),
('construction_completed', 5.00, '2026-03-31', 'production', 'construction'),
('fleet_utilization', 87.50, '2026-03-31', 'operations', 'fleet'),
('safety_incidents', 0.00, '2026-03-31', 'safety', 'incidents'),
('employee_hours', 8450.00, '2026-03-31', 'hr', 'attendance'),
('jobs_completed', 12.00, '2026-03-31', 'operations', 'jobs'),
('total_revenue', 45000000.00, '2026-04-20', 'financial', 'month_to_date'),
('ore_produced', 4200.00, '2026-04-20', 'production', 'mining'),
('active_jobs', 8.00, '2026-04-20', 'operations', 'jobs'),
('available_trucks', 5.00, '2026-04-20', 'operations', 'fleet');

-- Seed salaries for April 2026
INSERT INTO salaries (employee_id, amount, payment_date, payment_month, payment_year, status, deductions, bonuses, net_amount, paid_by) VALUES
(1, 1500000.00, '2026-04-30', 4, 2026, 'pending', 150000.00, 0.00, 1350000.00, NULL),
(2, 1200000.00, '2026-04-30', 4, 2026, 'pending', 120000.00, 50000.00, 1130000.00, NULL),
(3, 800000.00, '2026-04-30', 4, 2026, 'pending', 80000.00, 0.00, 720000.00, NULL),
(4, 1100000.00, '2026-04-30', 4, 2026, 'pending', 110000.00, 25000.00, 1015000.00, NULL),
(5, 900000.00, '2026-04-30', 4, 2026, 'pending', 90000.00, 0.00, 810000.00, NULL),
(6, 750000.00, '2026-04-30', 4, 2026, 'pending', 75000.00, 0.00, 675000.00, NULL),
(7, 650000.00, '2026-04-30', 4, 2026, 'pending', 65000.00, 0.00, 585000.00, NULL),
(8, 850000.00, '2026-04-30', 4, 2026, 'pending', 85000.00, 0.00, 765000.00, NULL);
