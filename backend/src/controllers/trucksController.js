const { v4: uuidv4 } = require('uuid');
const { validationResult } = require('express-validator');
const pool = require('../config/db');

const getAllTrucks = async (req, res, next) => {
  try {
    const { status, search } = req.query;
    let query = 'SELECT * FROM trucks WHERE 1=1';
    const params = [];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    if (search) {
      query += ' AND (name LIKE ? OR plate_number LIKE ? OR model LIKE ? OR driver LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY created_at DESC';

    const [trucks] = await pool.query(query, params);
    res.json({ trucks, count: trucks.length });
  } catch (error) {
    next(error);
  }
};

const getTruckById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [trucks] = await pool.query('SELECT * FROM trucks WHERE id = ?', [id]);

    if (trucks.length === 0) {
      return res.status(404).json({ error: 'Truck not found' });
    }

    res.json({ truck: trucks[0] });
  } catch (error) {
    next(error);
  }
};

const createTruck = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
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
    res.status(201).json({ truck: newTruck[0], message: 'Truck created successfully' });
  } catch (error) {
    next(error);
  }
};

const updateTruck = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const [existingTrucks] = await pool.query('SELECT id FROM trucks WHERE id = ?', [id]);

    if (existingTrucks.length === 0) {
      return res.status(404).json({ error: 'Truck not found' });
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
    res.json({ truck: updatedTruck[0], message: 'Truck updated successfully' });
  } catch (error) {
    next(error);
  }
};

const deleteTruck = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [existingTrucks] = await pool.query('SELECT id FROM trucks WHERE id = ?', [id]);

    if (existingTrucks.length === 0) {
      return res.status(404).json({ error: 'Truck not found' });
    }

    await pool.query('DELETE FROM trucks WHERE id = ?', [id]);
    res.json({ message: 'Truck deleted successfully' });
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

    res.json({
      status: statusStats,
      totals: totalStats[0],
      maintenanceDue: maintenanceDue[0].count
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllTrucks,
  getTruckById,
  createTruck,
  updateTruck,
  deleteTruck,
  getTruckStats
};
