const { v4: uuidv4 } = require('uuid');
const { validationResult } = require('express-validator');
const pool = require('../config/db');
const { APIFeatures, apiResponse, apiError } = require('../utils/apiFeatures');

const getAllTrucks = async (req, res, next) => {
  try {
    const { search } = req.query;
    let baseQuery = 'SELECT * FROM trucks WHERE 1=1';
    const params = [];

    if (search) {
      baseQuery += ' AND (name LIKE ? OR plate_number LIKE ? OR model LIKE ? OR driver LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    const allowedFilters = ['status', 'fuel_level', 'mileage', 'year'];
    const allowedSorts = ['name', 'plate_number', 'status', 'fuel_level', 'mileage', 'created_at', 'updated_at'];

    const features = new APIFeatures(baseQuery, req.query, allowedFilters, allowedSorts)
      .filter()
      .sort()
      .paginate();

    const { query, params: queryParams, pagination } = features.getQuery();
    const finalParams = [...params, ...queryParams];

    const [trucks] = await pool.query(query, finalParams);

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

    return apiResponse(res, trucks, { pagination: paginationMeta });
  } catch (error) {
    next(error);
  }
};

const getTruckById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [trucks] = await pool.query('SELECT * FROM trucks WHERE id = ?', [id]);

    if (trucks.length === 0) {
      return apiError(res, 'Truck not found', 404);
    }

    return apiResponse(res, trucks[0]);
  } catch (error) {
    next(error);
  }
};

const createTruck = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return apiError(res, 'Validation failed', 400, errors.array());
    }

    const id = uuidv4();
    const {
      name,
      plate_number,
      model,
      year,
      status,
      driver,
      assigned_job,
      fuel_level,
      mileage,
      last_maintenance,
      next_maintenance
    } = req.body;

    await pool.query(
      `INSERT INTO trucks (
        id, name, plate_number, model, year, status, driver, assigned_job,
        fuel_level, mileage, last_maintenance, next_maintenance
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, name, plate_number, model, year, status || 'available', driver,
        assigned_job, fuel_level || 100, mileage || 0, last_maintenance, next_maintenance
      ]
    );

    const [newTruck] = await pool.query('SELECT * FROM trucks WHERE id = ?', [id]);
    return apiResponse(res, newTruck[0]).status(201);
  } catch (error) {
    next(error);
  }
};

const updateTruck = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return apiError(res, 'Validation failed', 400, errors.array());
    }

    const { id } = req.params;
    const [existingTrucks] = await pool.query('SELECT id FROM trucks WHERE id = ?', [id]);

    if (existingTrucks.length === 0) {
      return apiError(res, 'Truck not found', 404);
    }

    const {
      name,
      plate_number,
      model,
      year,
      status,
      driver,
      assigned_job,
      fuel_level,
      mileage,
      last_maintenance,
      next_maintenance
    } = req.body;

    await pool.query(
      `UPDATE trucks SET
        name = COALESCE(?, name),
        plate_number = COALESCE(?, plate_number),
        model = COALESCE(?, model),
        year = COALESCE(?, year),
        status = COALESCE(?, status),
        driver = COALESCE(?, driver),
        assigned_job = COALESCE(?, assigned_job),
        fuel_level = COALESCE(?, fuel_level),
        mileage = COALESCE(?, mileage),
        last_maintenance = COALESCE(?, last_maintenance),
        next_maintenance = COALESCE(?, next_maintenance)
      WHERE id = ?`,
      [
        name, plate_number, model, year, status, driver, assigned_job,
        fuel_level, mileage, last_maintenance, next_maintenance, id
      ]
    );

    const [updatedTruck] = await pool.query('SELECT * FROM trucks WHERE id = ?', [id]);
    return apiResponse(res, updatedTruck[0]);
  } catch (error) {
    next(error);
  }
};

const deleteTruck = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [existingTrucks] = await pool.query('SELECT id FROM trucks WHERE id = ?', [id]);

    if (existingTrucks.length === 0) {
      return apiError(res, 'Truck not found', 404);
    }

    await pool.query('DELETE FROM trucks WHERE id = ?', [id]);
    return apiResponse(res, { message: 'Truck deleted successfully', id });
  } catch (error) {
    next(error);
  }
};

const getTruckStats = async (req, res, next) => {
  try {
    const [statusStats] = await pool.query(`
      SELECT status, COUNT(*) as count 
      FROM trucks 
      GROUP BY status
    `);

    const [totalStats] = await pool.query(`
      SELECT 
        COUNT(*) as total_trucks,
        SUM(mileage) as total_mileage,
        AVG(fuel_level) as average_fuel_level
      FROM trucks
    `);

    const [maintenanceDue] = await pool.query(`
      SELECT COUNT(*) as count
      FROM trucks 
      WHERE next_maintenance <= CURDATE() + INTERVAL 7 DAY
      AND status != 'maintenance'
    `);

    return apiResponse(res, {
      status: statusStats,
      totals: totalStats[0],
      maintenanceDue: maintenanceDue[0].count
    });
  } catch (error) {
    next(error);
  }
};

// Bulk Operations
const bulkCreateTrucks = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { trucks } = req.body;
    
    if (!Array.isArray(trucks) || trucks.length === 0) {
      return apiError(res, 'Trucks array is required', 400);
    }

    if (trucks.length > 100) {
      return apiError(res, 'Maximum 100 trucks can be created in bulk', 400);
    }

    const createdTrucks = [];
    const errors = [];

    for (let i = 0; i < trucks.length; i++) {
      const truck = trucks[i];
      const id = uuidv4();
      
      try {
        await connection.query(
          `INSERT INTO trucks (
            id, name, plate_number, model, year, status, driver, assigned_job,
            fuel_level, mileage, last_maintenance, next_maintenance
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id, 
            truck.name, 
            truck.plate_number, 
            truck.model, 
            truck.year, 
            truck.status || 'available', 
            truck.driver,
            truck.assigned_job, 
            truck.fuel_level || 100, 
            truck.mileage || 0, 
            truck.last_maintenance, 
            truck.next_maintenance
          ]
        );

        const [newTruck] = await connection.query('SELECT * FROM trucks WHERE id = ?', [id]);
        createdTrucks.push(newTruck[0]);
      } catch (err) {
        errors.push({ index: i, error: err.message, truck });
      }
    }

    await connection.commit();

    return apiResponse(res, {
      created: createdTrucks,
      failed: errors,
      successCount: createdTrucks.length,
      failedCount: errors.length
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

const bulkUpdateTrucks = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { updates } = req.body;
    
    if (!Array.isArray(updates) || updates.length === 0) {
      return apiError(res, 'Updates array is required', 400);
    }

    if (updates.length > 100) {
      return apiError(res, 'Maximum 100 trucks can be updated in bulk', 400);
    }

    const updatedTrucks = [];
    const errors = [];

    for (let i = 0; i < updates.length; i++) {
      const { id, ...fields } = updates[i];
      
      try {
        const [existing] = await connection.query('SELECT id FROM trucks WHERE id = ?', [id]);
        if (existing.length === 0) {
          errors.push({ index: i, error: 'Truck not found', id });
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
          `UPDATE trucks SET ${setClauses.join(', ')} WHERE id = ?`,
          params
        );

        const [updatedTruck] = await connection.query('SELECT * FROM trucks WHERE id = ?', [id]);
        updatedTrucks.push(updatedTruck[0]);
      } catch (err) {
        errors.push({ index: i, error: err.message, id });
      }
    }

    await connection.commit();

    return apiResponse(res, {
      updated: updatedTrucks,
      failed: errors,
      successCount: updatedTrucks.length,
      failedCount: errors.length
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

const bulkDeleteTrucks = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { ids } = req.body;
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return apiError(res, 'IDs array is required', 400);
    }

    if (ids.length > 100) {
      return apiError(res, 'Maximum 100 trucks can be deleted in bulk', 400);
    }

    const deletedIds = [];
    const errors = [];

    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      
      try {
        const [existing] = await connection.query('SELECT id FROM trucks WHERE id = ?', [id]);
        if (existing.length === 0) {
          errors.push({ index: i, error: 'Truck not found', id });
          continue;
        }

        await connection.query('DELETE FROM trucks WHERE id = ?', [id]);
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
  getAllTrucks,
  getTruckById,
  createTruck,
  updateTruck,
  deleteTruck,
  getTruckStats,
  bulkCreateTrucks,
  bulkUpdateTrucks,
  bulkDeleteTrucks
};
