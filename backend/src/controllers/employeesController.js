const { validationResult } = require('express-validator');
const { query, getClient } = require('../config/db');
const { apiResponse, apiError } = require('../utils/apiFeatures');

const getAllEmployees = async (req, res, next) => {
  try {
    const { search, department, status } = req.query;
    let sql = `SELECT e.*, u.name as user_name FROM employees e LEFT JOIN users u ON e.user_id = u.id WHERE 1=1`;
    const params = [];
    let idx = 1;

    if (search) {
      sql += ` AND (e.first_name ILIKE $${idx} OR e.last_name ILIKE $${idx+1} OR e.email ILIKE $${idx+2} OR e.position ILIKE $${idx+3} OR e.department ILIKE $${idx+4})`;
      params.push(`%${search}%`,`%${search}%`,`%${search}%`,`%${search}%`,`%${search}%`);
      idx += 5;
    }
    if (department) {
      sql += ` AND e.department = $${idx}`;
      params.push(department);
      idx++;
    }
    if (status) {
      sql += ` AND e.status = $${idx}`;
      params.push(status);
      idx++;
    }

    sql += ' ORDER BY e.last_name ASC, e.first_name ASC';

    const result = await query(sql, params);
    const countResult = await query('SELECT COUNT(*) as total FROM employees', []);
    return apiResponse(res, result.rows, { total: parseInt(countResult.rows[0].total) });
  } catch (error) {
    next(error);
  }
};

const getEmployeeById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await query(
      `SELECT e.*, u.name as user_name FROM employees e LEFT JOIN users u ON e.user_id = u.id WHERE e.id = $1`,
      [id]
    );
    if (result.rows.length === 0) return apiError(res, 'Employee not found', 404);
    return apiResponse(res, result.rows[0]);
  } catch (error) {
    next(error);
  }
};

const createEmployee = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return apiError(res, 'Validation failed', 400, errors.array());

    const {
      user_id, first_name, last_name, email, phone, position, department,
      salary, hourly_rate, hire_date, employment_type, status,
      address, emergency_contact, emergency_phone, date_of_birth, national_id
    } = req.body;

    const result = await query(
      `INSERT INTO employees (user_id,first_name,last_name,email,phone,position,department,salary,hourly_rate,hire_date,employment_type,status,address,emergency_contact,emergency_phone,date_of_birth,national_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17) RETURNING *`,
      [user_id||null, first_name, last_name, email, phone||null, position, department,
       salary||0, hourly_rate||0, hire_date, employment_type||'full_time', status||'active',
       address||null, emergency_contact||null, emergency_phone||null, date_of_birth||null, national_id||null]
    );
    return apiResponse(res, result.rows[0], {}, 201);
  } catch (error) {
    next(error);
  }
};

const updateEmployee = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return apiError(res, 'Validation failed', 400, errors.array());

    const { id } = req.params;
    const existing = await query('SELECT id FROM employees WHERE id = $1', [id]);
    if (existing.rows.length === 0) return apiError(res, 'Employee not found', 404);

    const {
      first_name, last_name, email, phone, position, department,
      salary, hourly_rate, hire_date, employment_type, status,
      address, emergency_contact, emergency_phone
    } = req.body;

    const result = await query(
      `UPDATE employees SET
        first_name=COALESCE($1,first_name), last_name=COALESCE($2,last_name),
        email=COALESCE($3,email), phone=COALESCE($4,phone),
        position=COALESCE($5,position), department=COALESCE($6,department),
        salary=COALESCE($7,salary), hourly_rate=COALESCE($8,hourly_rate),
        hire_date=COALESCE($9,hire_date), employment_type=COALESCE($10,employment_type),
        status=COALESCE($11,status), address=COALESCE($12,address),
        emergency_contact=COALESCE($13,emergency_contact),
        emergency_phone=COALESCE($14,emergency_phone),
        updated_at=NOW()
       WHERE id=$15 RETURNING *`,
      [first_name,last_name,email,phone,position,department,salary,hourly_rate,hire_date,employment_type,status,address,emergency_contact,emergency_phone,id]
    );
    return apiResponse(res, result.rows[0]);
  } catch (error) {
    next(error);
  }
};

const deleteEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await query('SELECT id FROM employees WHERE id = $1', [id]);
    if (existing.rows.length === 0) return apiError(res, 'Employee not found', 404);
    await query('DELETE FROM employees WHERE id = $1', [id]);
    return apiResponse(res, { message: 'Employee deleted successfully', id });
  } catch (error) {
    next(error);
  }
};

const getEmployeeStats = async (req, res, next) => {
  try {
    const [statusStats, departmentStats, totalStats] = await Promise.all([
      query('SELECT status, COUNT(*) as count FROM employees GROUP BY status'),
      query('SELECT department, COUNT(*) as count, COALESCE(SUM(salary),0) as total_salary FROM employees GROUP BY department ORDER BY count DESC'),
      query('SELECT COUNT(*) as total_employees, COALESCE(SUM(salary),0) as total_salary, COALESCE(AVG(salary),0) as avg_salary FROM employees')
    ]);
    return apiResponse(res, {
      byStatus: statusStats.rows,
      byDepartment: departmentStats.rows,
      totals: totalStats.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

const processPayroll = async (req, res, next) => {
  try {
    const month = new Date().getMonth() + 1;
    const year = new Date().getFullYear();

    const employees = await query(`SELECT id, salary FROM employees WHERE status = 'active'`, []);

    let processed = 0;
    for (const emp of employees.rows) {
      const existing = await query(
        'SELECT id FROM salaries WHERE employee_id=$1 AND payment_month=$2 AND payment_year=$3',
        [emp.id, month, year]
      );
      if (existing.rows.length === 0) {
        await query(
          `INSERT INTO salaries (employee_id,amount,payment_date,payment_month,payment_year,status,deductions,bonuses,net_amount,paid_by)
           VALUES ($1,$2,CURRENT_DATE,$3,$4,'pending',0,0,$5,$6)`,
          [emp.id, emp.salary, month, year, emp.salary, req.user.id]
        );
        processed++;
      }
    }

    return apiResponse(res, { message: `Payroll processed for ${processed} employees`, processedCount: processed });
  } catch (error) {
    next(error);
  }
};

const bulkCreateEmployees = async (req, res, next) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const { employees } = req.body;
    if (!Array.isArray(employees) || employees.length === 0) return apiError(res, 'Employees array required', 400);

    const created = [], failed = [];
    for (let i = 0; i < employees.length; i++) {
      const emp = employees[i];
      try {
        const r = await client.query(
          `INSERT INTO employees (first_name,last_name,email,phone,position,department,salary,hourly_rate,hire_date,employment_type,status)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
          [emp.first_name,emp.last_name,emp.email,emp.phone||null,emp.position,emp.department,emp.salary||0,emp.hourly_rate||0,emp.hire_date,emp.employment_type||'full_time',emp.status||'active']
        );
        created.push(r.rows[0]);
      } catch (err) {
        failed.push({ index: i, error: err.message, employee: emp });
      }
    }
    await client.query('COMMIT');
    return apiResponse(res, { created, failed, successCount: created.length, failedCount: failed.length });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

const bulkUpdateEmployees = async (req, res, next) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const { updates } = req.body;
    if (!Array.isArray(updates) || updates.length === 0) return apiError(res, 'Updates array required', 400);

    const updated = [], failed = [];
    const allowed = ['first_name','last_name','email','phone','position','department','salary','hourly_rate','hire_date','employment_type','status'];

    for (let i = 0; i < updates.length; i++) {
      const { id, ...fields } = updates[i];
      try {
        const ex = await client.query('SELECT id FROM employees WHERE id=$1', [id]);
        if (ex.rows.length === 0) { failed.push({ index: i, error: 'Not found', id }); continue; }
        const setClauses = [], params = [];
        Object.keys(fields).filter(k => allowed.includes(k)).forEach(k => {
          params.push(fields[k]); setClauses.push(`${k}=$${params.length}`);
        });
        if (!setClauses.length) { failed.push({ index: i, error: 'No valid fields', id }); continue; }
        params.push(id);
        const r = await client.query(`UPDATE employees SET ${setClauses.join(',')},updated_at=NOW() WHERE id=$${params.length} RETURNING *`, params);
        updated.push(r.rows[0]);
      } catch (err) {
        failed.push({ index: i, error: err.message, id });
      }
    }
    await client.query('COMMIT');
    return apiResponse(res, { updated, failed, successCount: updated.length, failedCount: failed.length });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

const bulkDeleteEmployees = async (req, res, next) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) return apiError(res, 'IDs array required', 400);

    const deleted = [], failed = [];
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      try {
        const ex = await client.query('SELECT id FROM employees WHERE id=$1', [id]);
        if (ex.rows.length === 0) { failed.push({ index: i, error: 'Not found', id }); continue; }
        await client.query('DELETE FROM employees WHERE id=$1', [id]);
        deleted.push(id);
      } catch (err) {
        failed.push({ index: i, error: err.message, id });
      }
    }
    await client.query('COMMIT');
    return apiResponse(res, { deleted, failed, successCount: deleted.length, failedCount: failed.length });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

module.exports = {
  getAllEmployees, getEmployeeById, createEmployee, updateEmployee, deleteEmployee,
  getEmployeeStats, processPayroll, bulkCreateEmployees, bulkUpdateEmployees, bulkDeleteEmployees
};
