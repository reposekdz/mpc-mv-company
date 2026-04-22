const { v4: uuidv4 } = require('uuid');
const { validationResult } = require('express-validator');
const pool = require('../config/db');
const { APIFeatures, apiResponse, apiError } = require('../utils/apiFeatures');

const getAllEmployees = async (req, res, next) => {
  try {
    const { search } = req.query;
    let baseQuery = 'SELECT * FROM employees WHERE 1=1';
    const params = [];

    if (search) {
      baseQuery += ' AND (name LIKE ? OR role LIKE ? OR department LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const allowedFilters = ['department', 'payment_status', 'base_salary', 'pay_period'];
    const allowedSorts = ['name', 'role', 'department', 'base_salary', 'payment_status', 'created_at'];

    const features = new APIFeatures(baseQuery, req.query, allowedFilters, allowedSorts)
      .filter()
      .sort()
      .paginate();

    const { query, params: queryParams, pagination } = features.getQuery();
    const finalParams = [...params, ...queryParams];

    const [employees] = await pool.query(query, finalParams);

    // Get total count for pagination metadata
    const countQuery = baseQuery.replace('SELECT *', 'SELECT COUNT(*) as total');
    const [countResult] = await pool.query(countQuery, params);
    const total = countResult[0].total;

    const paginationMeta = await APIFeatures.buildPaginationMeta(
      total,
      pagination.page,
      pagination.limit,
      `${req.protocol}://${req.get('host')}${req.baseUrl}`,
      req.query
    );

    return apiResponse(res, employees, { pagination: paginationMeta });
  } catch (error) {
    next(error);
  }
};

const getEmployeeById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [employees] = await pool.query('SELECT * FROM employees WHERE id = ?', [id]);

    if (employees.length === 0) {
      return apiError(res, 'Employee not found', 404);
    }

    return apiResponse(res, employees[0]);
  } catch (error) {
    next(error);
  }
};

const createEmployee = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return apiError(res, 'Validation failed', 400, errors.array());
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
    return apiResponse(res, newEmployee[0]).status(201);
  } catch (error) {
    next(error);
  }
};

const updateEmployee = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return apiError(res, 'Validation failed', 400, errors.array());
    }

    const { id } = req.params;
    const [existingEmployees] = await pool.query('SELECT id FROM employees WHERE id = ?', [id]);

    if (existingEmployees.length === 0) {
      return apiError(res, 'Employee not found', 404);
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
    return apiResponse(res, updatedEmployee[0]);
  } catch (error) {
    next(error);
  }
};

const deleteEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [existingEmployees] = await pool.query('SELECT id FROM employees WHERE id = ?', [id]);

    if (existingEmployees.length === 0) {
      return apiError(res, 'Employee not found', 404);
    }

    await pool.query('DELETE FROM employees WHERE id = ?', [id]);
    return apiResponse(res, { message: 'Employee deleted successfully', id });
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

    return apiResponse(res, {
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
    const [result] = await pool.query(`
      UPDATE employees 
      SET payment_status = 'paid', payment_date = CURDATE()
      WHERE payment_status = 'pending'
    `);

    return apiResponse(res, { 
      message: 'Payroll processed successfully',
      processedCount: result.affectedRows
    });
  } catch (error) {
    next(error);
  }
};

// Bulk Operations
const bulkCreateEmployees = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { employees } = req.body;
    
    if (!Array.isArray(employees) || employees.length === 0) {
      return apiError(res, 'Employees array is required', 400);
    }

    if (employees.length > 100) {
      return apiError(res, 'Maximum 100 employees can be created in bulk', 400);
    }

    const createdEmployees = [];
    const errors = [];

    for (let i = 0; i < employees.length; i++) {
      const employee = employees[i];
      const id = uuidv4();
      
      try {
        await connection.query(
          `INSERT INTO employees (
            id, name, role, department, base_salary, deductions, bonuses,
            payment_status, payment_date, pay_period
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id, 
            employee.name, 
            employee.role, 
            employee.department, 
            employee.base_salary, 
            employee.deductions || 0, 
            employee.bonuses || 0,
            employee.payment_status || 'pending', 
            employee.payment_date, 
            employee.pay_period || 'monthly'
          ]
        );

        const [newEmployee] = await connection.query('SELECT * FROM employees WHERE id = ?', [id]);
        createdEmployees.push(newEmployee[0]);
      } catch (err) {
        errors.push({ index: i, error: err.message, employee });
      }
    }

    await connection.commit();

    return apiResponse(res, {
      created: createdEmployees,
      failed: errors,
      successCount: createdEmployees.length,
      failedCount: errors.length
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

const bulkUpdateEmployees = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { updates } = req.body;
    
    if (!Array.isArray(updates) || updates.length === 0) {
      return apiError(res, 'Updates array is required', 400);
    }

    if (updates.length > 100) {
      return apiError(res, 'Maximum 100 employees can be updated in bulk', 400);
    }

    const updatedEmployees = [];
    const errors = [];

    for (let i = 0; i < updates.length; i++) {
      const { id, ...fields } = updates[i];
      
      try {
        const [existing] = await connection.query('SELECT id FROM employees WHERE id = ?', [id]);
        if (existing.length === 0) {
          errors.push({ index: i, error: 'Employee not found', id });
          continue;
        }

        const setClauses = [];
        const params = [];

        Object.keys(fields).forEach(key => {
          setClauses.push(`${key} = ?`);
          params.push(fields[key]);
        });

        if (setClauses.length === 0) {
          errors.push({ index: i, error: 'No fields to update', id });
          continue;
        }

        params.push(id);

        await connection.query(
          `UPDATE employees SET ${setClauses.join(', ')} WHERE id = ?`,
          params
        );

        const [updatedEmployee] = await connection.query('SELECT * FROM employees WHERE id = ?', [id]);
        updatedEmployees.push(updatedEmployee[0]);
      } catch (err) {
        errors.push({ index: i, error: err.message, id });
      }
    }

    await connection.commit();

    return apiResponse(res, {
      updated: updatedEmployees,
      failed: errors,
      successCount: updatedEmployees.length,
      failedCount: errors.length
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

const bulkDeleteEmployees = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { ids } = req.body;
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return apiError(res, 'IDs array is required', 400);
    }

    if (ids.length > 100) {
      return apiError(res, 'Maximum 100 employees can be deleted in bulk', 400);
    }

    const deletedIds = [];
    const errors = [];

    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      
      try {
        const [existing] = await connection.query('SELECT id FROM employees WHERE id = ?', [id]);
        if (existing.length === 0) {
          errors.push({ index: i, error: 'Employee not found', id });
          continue;
        }

        await connection.query('DELETE FROM employees WHERE id = ?', [id]);
        deletedIds.push(id);
      } catch (err) {
        errors.push({ index: i, error: err.message, id });
      }
    }

    await connection.commit();

    return apiResponse(res, {
      deleted: deletedIds,
      failed: errors,
      successCount: deletedIds.length,
      failedCount: errors.length
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

module.exports = {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getPayrollStats,
  processPayroll,
  bulkCreateEmployees,
  bulkUpdateEmployees,
  bulkDeleteEmployees
};
