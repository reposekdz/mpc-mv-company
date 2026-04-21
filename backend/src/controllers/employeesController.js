const { v4: uuidv4 } = require('uuid');
const { validationResult } = require('express-validator');
const pool = require('../config/db');

const getAllEmployees = async (req, res, next) => {
  try {
    const { department, payment_status, search } = req.query;
    let query = 'SELECT * FROM employees WHERE 1=1';
    const params = [];

    if (department) {
      query += ' AND department = ?';
      params.push(department);
    }

    if (payment_status) {
      query += ' AND payment_status = ?';
      params.push(payment_status);
    }

    if (search) {
      query += ' AND (name LIKE ? OR role LIKE ? OR department LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY created_at DESC';

    const [employees] = await pool.query(query, params);
    res.json(employees);
  } catch (error) {
    next(error);
  }
};

const getEmployeeById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [employees] = await pool.query('SELECT * FROM employees WHERE id = ?', [id]);

    if (employees.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.json(employees[0]);
  } catch (error) {
    next(error);
  }
};

const createEmployee = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const id = uuidv4();
    const {
      name,
      role,
      department,
      base_salary,
      deductions,
      bonuses,
      payment_status,
      payment_date,
      pay_period
    } = req.body;

    await pool.query(
      `INSERT INTO employees (
        id, name, role, department, base_salary, deductions, bonuses,
        payment_status, payment_date, pay_period
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, name, role, department, base_salary, deductions || 0, bonuses || 0,
        payment_status || 'pending', payment_date, pay_period || 'monthly'
      ]
    );

    const [newEmployee] = await pool.query('SELECT * FROM employees WHERE id = ?', [id]);
    res.status(201).json({ employee: newEmployee[0], message: 'Employee created successfully' });
  } catch (error) {
    next(error);
  }
};

const updateEmployee = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const [existingEmployees] = await pool.query('SELECT id FROM employees WHERE id = ?', [id]);

    if (existingEmployees.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const {
      name,
      role,
      department,
      base_salary,
      deductions,
      bonuses,
      payment_status,
      payment_date,
      pay_period
    } = req.body;

    await pool.query(
      `UPDATE employees SET
        name = COALESCE(?, name),
        role = COALESCE(?, role),
        department = COALESCE(?, department),
        base_salary = COALESCE(?, base_salary),
        deductions = COALESCE(?, deductions),
        bonuses = COALESCE(?, bonuses),
        payment_status = COALESCE(?, payment_status),
        payment_date = COALESCE(?, payment_date),
        pay_period = COALESCE(?, pay_period)
      WHERE id = ?`,
      [
        name, role, department, base_salary, deductions, bonuses,
        payment_status, payment_date, pay_period, id
      ]
    );

    const [updatedEmployee] = await pool.query('SELECT * FROM employees WHERE id = ?', [id]);
    res.json({ employee: updatedEmployee[0], message: 'Employee updated successfully' });
  } catch (error) {
    next(error);
  }
};

const deleteEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [existingEmployees] = await pool.query('SELECT id FROM employees WHERE id = ?', [id]);

    if (existingEmployees.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    await pool.query('DELETE FROM employees WHERE id = ?', [id]);
    res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    next(error);
  }
};

const getPayrollStats = async (req, res, next) => {
  try {
    const [statusStats] = await pool.query(`
      SELECT payment_status, COUNT(*) as count, SUM(net_pay) as total
      FROM employees 
      GROUP BY payment_status
    `);

    const [departmentStats] = await pool.query(`
      SELECT department, COUNT(*) as count, SUM(net_pay) as total_payroll
      FROM employees 
      GROUP BY department
    `);

    const [totalStats] = await pool.query(`
      SELECT 
        COUNT(*) as total_employees,
        SUM(base_salary) as total_base_salary,
        SUM(deductions) as total_deductions,
        SUM(bonuses) as total_bonuses,
        SUM(net_pay) as total_net_payroll
      FROM employees
    `);

    res.json({
      paymentStatus: statusStats,
      departments: departmentStats,
      totals: totalStats[0]
    });
  } catch (error) {
    next(error);
  }
};

const processPayroll = async (req, res, next) => {
  try {
    await pool.query(`
      UPDATE employees 
      SET payment_status = 'paid', payment_date = CURDATE()
      WHERE payment_status = 'pending'
    `);

    res.json({ message: 'Payroll processed successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getPayrollStats,
  processPayroll
};
