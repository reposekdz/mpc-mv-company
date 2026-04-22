const { v4: uuidv4 } = require('uuid');
const { validationResult } = require('express-validator');
const { query, getClient } = require('../config/db');
const { APIFeatures, apiResponse, apiError } = require('../utils/apiFeatures');

const getAllTrucks = async (req, res, next) => {
  try {
    const { search } = req.query;
    let baseQuery = 'SELECT * FROM trucks WHERE 1=1';
    const params = [];

    if (search) {
      baseQuery += ' AND (name ILIKE $1 OR plate_number ILIKE $2 OR model ILIKE $3)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const allowedFilters = ['status', 'fuel_level', 'mileage', 'year'];
    const allowedSorts = ['name', 'plate_number', 'status', 'fuel_level', 'mileage', 'created_at', 'updated_at'];

    const features = new APIFeatures(baseQuery, req.query, allowedFilters, allowedSorts)
      .filter()
      .sort()
      .paginate();

    const { query, params: queryParams, pagination } = features.getQuery();
    const finalParams = [...params, ...queryParams];

    const trucks = await query(query, finalParams);

    // Get total count for pagination metadata
    const countQuery = baseQuery.replace('SELECT *', 'SELECT COUNT(*) as total');
    const countResult = await query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);

    const paginationMeta = await APIFeatures.buildPaginationMeta(
      total,
      pagination.page,
      pagination.limit,
      `${req.protocol}://${req.get('host')}${req.baseUrl}`,
      req.query
    );

    return apiResponse(res, trucks.rows, { pagination: paginationMeta });
  } catch (error) {
    next(error);
  }
};

const getTruckById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const trucks = await query('SELECT * FROM trucks WHERE id = $1', [id]);

    if (trucks.rows.length === 0) {
      return apiError(res, 'Truck not found', 404);
    }

    return apiResponse(res, trucks.rows[0]);
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

    const {
      name,
      plate_number,
      type,
      model,
      year,
      status,
      driver_id,
      fuel_level,
      mileage,
      last_maintenance,
      next_maintenance
    } = req.body;

    const result = await query(
      `INSERT INTO trucks (
        plate_number, name, type, model, year, status, driver_id,
        fuel_level, mileage, last_maintenance, next_maintenance
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [
        plate_number, name, type, model, year, status || 'available', driver_id,
        fuel_level || 100, mileage || 0, last_maintenance, next_maintenance
      ]
    );

    return apiResponse(res, result.rows[0], {}, 201);
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
    const existingTrucks = await pool.query('SELECT id FROM trucks WHERE id = $1', [id]);

    if (existingTrucks.rows.length === 0) {
      return apiError(res, 'Truck not found', 404);
    }

    const {
      name,
      plate_number,
      type,
      model,
      year,
      status,
      driver_id,
      fuel_level,
      mileage,
      last_maintenance,
      next_maintenance
    } = req.body;

    const result = await query(
      `UPDATE trucks SET
        name = COALESCE($1, name),
        plate_number = COALESCE($2, plate_number),
        type = COALESCE($3, type),
        model = COALESCE($4, model),
        year = COALESCE($5, year),
        status = COALESCE($6, status),
        driver_id = COALESCE($7, driver_id),
        fuel_level = COALESCE($8, fuel_level),
        mileage = COALESCE($9, mileage),
        last_maintenance = COALESCE($10, last_maintenance),
        next_maintenance = COALESCE($11, next_maintenance)
      WHERE id = $12 RETURNING *`,
      [
        name, plate_number, type, model, year, status, driver_id,
        fuel_level, mileage, last_maintenance, next_maintenance, id
      ]
    );

    return apiResponse(res, result.rows[0]);
  } catch (error) {
    next(error);
  }
};

const deleteTruck = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existingTrucks = await pool.query('SELECT id FROM trucks WHERE id = $1', [id]);

    if (existingTrucks.rows.length === 0) {
      return apiError(res, 'Truck not found', 404);
    }

    await query('DELETE FROM trucks WHERE id = $1', [id]);
    return apiResponse(res, { message: 'Truck deleted successfully', id });
  } catch (error) {
    next(error);
  }
};

const getTruckStats = async (req, res, next) => {
  try {
    const statusStats = await query(`
      SELECT status, COUNT(*) as count
      FROM trucks
      GROUP BY status
    `);

    const totalStats = await query(`
      SELECT
        COUNT(*) as total_trucks,
        COALESCE(SUM(mileage), 0) as total_mileage,
        COALESCE(AVG(fuel_level), 0) as average_fuel_level
      FROM trucks
    `);

    const maintenanceDue = await query(`
      SELECT COUNT(*) as count
      FROM trucks
      WHERE next_maintenance <= CURRENT_DATE + INTERVAL '7 days'
      AND status != 'maintenance'
    `);

    return apiResponse(res, {
      status: statusStats.rows,
      totals: totalStats.rows[0],
      maintenanceDue: parseInt(maintenanceDue.rows[0].count)
    });
  } catch (error) {
    next(error);
  }
};

// Bulk Operations
const bulkCreateTrucks = async (req, res, next) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

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

      try {
        const result = await client.query(
          `INSERT INTO trucks (
            plate_number, name, type, model, year, status, driver_id,
            fuel_level, mileage, last_maintenance, next_maintenance
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
          [
            truck.plate_number,
            truck.name,
            truck.type,
            truck.model,
            truck.year,
            truck.status || 'available',
            truck.driver_id,
            truck.fuel_level || 100,
            truck.mileage || 0,
            truck.last_maintenance,
            truck.next_maintenance
          ]
        );

        createdTrucks.push(result.rows[0]);
      } catch (err) {
        errors.push({ index: i, error: err.message, truck });
      }
    }

    await client.query('COMMIT');

    return apiResponse(res, {
      created: createdTrucks,
      failed: errors,
      successCount: createdTrucks.length,
      failedCount: errors.length
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

const bulkUpdateTrucks = async (req, res, next) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

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
        const existing = await client.query('SELECT id FROM trucks WHERE id = $1', [id]);
        if (existing.rows.length === 0) {
          errors.push({ index: i, error: 'Truck not found', id });
          continue;
        }

        const setClauses = [];
        const params = [id];

        Object.keys(fields).forEach((key, index) => {
          setClauses.push(`${key} = $${index + 2}`);
          params.push(fields[key]);
        });

        if (setClauses.length === 0) {
          errors.push({ index: i, error: 'No fields to update', id });
          continue;
        }

        const result = await client.query(
          `UPDATE trucks SET ${setClauses.join(', ')} WHERE id = $1 RETURNING *`,
          params
        );

        updatedTrucks.push(result.rows[0]);
      } catch (err) {
        errors.push({ index: i, error: err.message, id });
      }
    }

    await client.query('COMMIT');

    return apiResponse(res, {
      updated: updatedTrucks,
      failed: errors,
      successCount: updatedTrucks.length,
      failedCount: errors.length
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

const bulkDeleteTrucks = async (req, res, next) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

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
        const existing = await client.query('SELECT id FROM trucks WHERE id = $1', [id]);
        if (existing.rows.length === 0) {
          errors.push({ index: i, error: 'Truck not found', id });
          continue;
        }

        await client.query('DELETE FROM trucks WHERE id = $1', [id]);
        deletedIds.push(id);
      } catch (err) {
        errors.push({ index: i, error: err.message, id });
      }
    }

    await client.query('COMMIT');

    return apiResponse(res, {
      deleted: deletedIds,
      failed: errors,
      successCount: deletedIds.length,
      failedCount: errors.length
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
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
