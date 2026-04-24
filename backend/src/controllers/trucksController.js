const { v4: uuidv4 } = require('uuid');
const { validationResult } = require('express-validator');
const { query, getClient } = require('../config/db');
const { APIFeatures, apiResponse, apiError } = require('../utils/apiFeatures');

const getAllTrucks = async (req, res, next) => {
  try {
    const { search } = req.query;
    let baseQuery = 'SELECT t.*, u.name as driver_name FROM trucks t LEFT JOIN users u ON t.driver_id = u.id WHERE 1=1';
    const params = [];

    if (search) {
      baseQuery += ` AND (t.name ILIKE $1 OR t.plate_number ILIKE $2 OR t.model ILIKE $3)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const allowedFilters = ['status', 'type'];
    const allowedSorts = ['name', 'plate_number', 'status', 'fuel_level', 'mileage', 'created_at', 'updated_at'];

    const features = new APIFeatures(baseQuery, req.query, allowedFilters, allowedSorts, params.length)
      .filter()
      .sort()
      .paginate();

    const { sql, params: featureParams, pagination } = features.getQuery();
    const finalParams = [...params, ...featureParams];
    const result = await query(sql, finalParams);

    const countBase = search
      ? `SELECT COUNT(*) as total FROM trucks WHERE (name ILIKE $1 OR plate_number ILIKE $2 OR model ILIKE $3)`
      : `SELECT COUNT(*) as total FROM trucks WHERE 1=1`;
    const countResult = await query(countBase, params);
    const total = parseInt(countResult.rows[0].total);

    const paginationMeta = await APIFeatures.buildPaginationMeta(
      total, pagination.page, pagination.limit,
      `${req.protocol}://${req.get('host')}${req.baseUrl}`, req.query
    );

    return apiResponse(res, result.rows, { pagination: paginationMeta });
  } catch (error) {
    next(error);
  }
};

const getTruckById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await query(
      'SELECT t.*, u.name as driver_name FROM trucks t LEFT JOIN users u ON t.driver_id = u.id WHERE t.id = $1',
      [id]
    );
    if (result.rows.length === 0) return apiError(res, 'Truck not found', 404);
    return apiResponse(res, result.rows[0]);
  } catch (error) {
    next(error);
  }
};

const createTruck = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return apiError(res, 'Validation failed', 400, errors.array());

    const {
      name, plate_number, type, model, year, status, driver_id,
      fuel_level, mileage, last_maintenance, next_maintenance, current_location, value, purchase_date
    } = req.body;

    const result = await query(
      `INSERT INTO trucks (plate_number,name,type,model,year,status,driver_id,fuel_level,mileage,last_maintenance,next_maintenance,current_location,value,purchase_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
      [plate_number, name, type, model||null, year||null, status||'available', driver_id||null,
       fuel_level||100, mileage||0, last_maintenance||null, next_maintenance||null,
       current_location||null, value||0, purchase_date||null]
    );
    const truck = result.rows[0];
    const io = req.app.get('io');
    if (io) {
      io.to('managers').emit('truck-created', truck);
      io.to('admins').emit('truck-created', truck);
    }
    return apiResponse(res, truck, {}, 201);
  } catch (error) {
    next(error);
  }
};

const updateTruck = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return apiError(res, 'Validation failed', 400, errors.array());

    const { id } = req.params;
    const existing = await query('SELECT id FROM trucks WHERE id = $1', [id]);
    if (existing.rows.length === 0) return apiError(res, 'Truck not found', 404);

    const {
      name, plate_number, type, model, year, status, driver_id,
      fuel_level, mileage, last_maintenance, next_maintenance, current_location
    } = req.body;

    const result = await query(
      `UPDATE trucks SET
        name=COALESCE($1,name), plate_number=COALESCE($2,plate_number),
        type=COALESCE($3,type), model=COALESCE($4,model), year=COALESCE($5,year),
        status=COALESCE($6,status), driver_id=COALESCE($7,driver_id),
        fuel_level=COALESCE($8,fuel_level), mileage=COALESCE($9,mileage),
        last_maintenance=COALESCE($10,last_maintenance),
        next_maintenance=COALESCE($11,next_maintenance),
        current_location=COALESCE($12,current_location),
        updated_at=NOW()
       WHERE id=$13 RETURNING *`,
      [name, plate_number, type, model, year, status, driver_id,
       fuel_level, mileage, last_maintenance, next_maintenance, current_location, id]
    );
    const truck = result.rows[0];
    const io = req.app.get('io');
    if (io) {
      io.to('managers').emit('truck-updated', truck);
      io.to('admins').emit('truck-updated', truck);
    }
    return apiResponse(res, truck);
  } catch (error) {
    next(error);
  }
};

const deleteTruck = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await query('SELECT id FROM trucks WHERE id = $1', [id]);
    if (existing.rows.length === 0) return apiError(res, 'Truck not found', 404);
    await query('DELETE FROM trucks WHERE id = $1', [id]);
    return apiResponse(res, { message: 'Truck deleted successfully', id });
  } catch (error) {
    next(error);
  }
};

const getTruckStats = async (req, res, next) => {
  try {
    const [statusStats, totalStats, maintenanceDue] = await Promise.all([
      query('SELECT status, COUNT(*) as count FROM trucks GROUP BY status'),
      query(`SELECT COUNT(*) as total_trucks, COALESCE(SUM(mileage),0) as total_mileage, COALESCE(AVG(fuel_level),0) as average_fuel_level FROM trucks`),
      query(`SELECT COUNT(*) as count FROM trucks WHERE next_maintenance <= CURRENT_DATE + INTERVAL '7 days' AND status != 'maintenance'`)
    ]);
    return apiResponse(res, {
      status: statusStats.rows,
      totals: totalStats.rows[0],
      maintenanceDue: parseInt(maintenanceDue.rows[0].count)
    });
  } catch (error) {
    next(error);
  }
};

const bulkCreateTrucks = async (req, res, next) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const { trucks } = req.body;
    if (!Array.isArray(trucks) || trucks.length === 0) return apiError(res, 'Trucks array required', 400);
    if (trucks.length > 50) return apiError(res, 'Maximum 50 trucks per bulk operation', 400);

    const created = [], failed = [];
    for (let i = 0; i < trucks.length; i++) {
      const truck = trucks[i];
      try {
        const r = await client.query(
          `INSERT INTO trucks (plate_number,name,type,model,year,status,driver_id,fuel_level,mileage,last_maintenance,next_maintenance)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
          [truck.plate_number,truck.name,truck.type,truck.model||null,truck.year||null,truck.status||'available',truck.driver_id||null,truck.fuel_level||100,truck.mileage||0,truck.last_maintenance||null,truck.next_maintenance||null]
        );
        created.push(r.rows[0]);
      } catch (err) {
        failed.push({ index: i, error: err.message, truck });
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

const bulkUpdateTrucks = async (req, res, next) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const { updates } = req.body;
    if (!Array.isArray(updates) || updates.length === 0) return apiError(res, 'Updates array required', 400);

    const updated = [], failed = [];
    const allowed = ['name','plate_number','type','model','year','status','driver_id','fuel_level','mileage','last_maintenance','next_maintenance','current_location'];

    for (let i = 0; i < updates.length; i++) {
      const { id, ...fields } = updates[i];
      try {
        const ex = await client.query('SELECT id FROM trucks WHERE id=$1', [id]);
        if (ex.rows.length === 0) { failed.push({ index: i, error: 'Not found', id }); continue; }
        const setClauses = [], params = [];
        Object.keys(fields).filter(k => allowed.includes(k)).forEach(k => {
          params.push(fields[k]); setClauses.push(`${k}=$${params.length}`);
        });
        if (!setClauses.length) { failed.push({ index: i, error: 'No valid fields', id }); continue; }
        params.push(id);
        const r = await client.query(`UPDATE trucks SET ${setClauses.join(',')},updated_at=NOW() WHERE id=$${params.length} RETURNING *`, params);
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

const bulkDeleteTrucks = async (req, res, next) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) return apiError(res, 'IDs array required', 400);

    const deleted = [], failed = [];
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      try {
        const ex = await client.query('SELECT id FROM trucks WHERE id=$1', [id]);
        if (ex.rows.length === 0) { failed.push({ index: i, error: 'Not found', id }); continue; }
        await client.query('DELETE FROM trucks WHERE id=$1', [id]);
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

module.exports = { getAllTrucks, getTruckById, createTruck, updateTruck, deleteTruck, getTruckStats, bulkCreateTrucks, bulkUpdateTrucks, bulkDeleteTrucks };
