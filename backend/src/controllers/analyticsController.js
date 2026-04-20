const pool = require('../config/db');

const getAnalyticsData = async (req, res, next) => {
  try {
    const [analytics] = await pool.query(`
      SELECT * FROM analytics_data 
      ORDER BY created_at ASC
    `);

    res.json({ analytics });
  } catch (error) {
    next(error);
  }
};

const getDashboardStats = async (req, res, next) => {
  try {
    const [[jobsStats]] = await pool.query(`
      SELECT 
        COUNT(*) as total_jobs,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_jobs,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as active_jobs,
        SUM(budget) as total_budget
      FROM jobs
    `);

    const [[trucksStats]] = await pool.query(`
      SELECT 
        COUNT(*) as total_trucks,
        SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available_trucks,
        SUM(CASE WHEN status = 'in_use' THEN 1 ELSE 0 END) as active_trucks,
        SUM(mileage) as total_mileage
      FROM trucks
    `);

    const [[employeesStats]] = await pool.query(`
      SELECT 
        COUNT(*) as total_employees,
        SUM(net_pay) as total_payroll,
        SUM(CASE WHEN payment_status = 'pending' THEN 1 ELSE 0 END) as pending_payments
      FROM employees
    `);

    const [[meetingsStats]] = await pool.query(`
      SELECT 
        COUNT(*) as total_meetings,
        SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END) as upcoming_meetings
      FROM meetings
      WHERE date >= CURDATE()
    `);

    const [[financialSummary]] = await pool.query(`
      SELECT 
        SUM(revenue) as total_revenue,
        SUM(expenses) as total_expenses,
        SUM(profit) as total_profit
      FROM analytics_data
    `);

    const recentActivities = await Promise.all([
      pool.query(`SELECT id, title, status, created_at, 'job' as type FROM jobs ORDER BY created_at DESC LIMIT 5`),
      pool.query(`SELECT id, name, status, created_at, 'truck' as type FROM trucks ORDER BY created_at DESC LIMIT 5`),
      pool.query(`SELECT id, title, status, created_at, 'meeting' as type FROM meetings ORDER BY created_at DESC LIMIT 5`)
    ]);

    const allActivities = [
      ...recentActivities[0][0],
      ...recentActivities[1][0],
      ...recentActivities[2][0]
    ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 10);

    res.json({
      jobs: jobsStats,
      trucks: trucksStats,
      employees: employeesStats,
      meetings: meetingsStats,
      financial: financialSummary,
      recentActivities: allActivities
    });
  } catch (error) {
    next(error);
  }
};

const getMonthlyTrends = async (req, res, next) => {
  try {
    const [trends] = await pool.query(`
      SELECT month, revenue, expenses, profit, jobs_completed
      FROM analytics_data
      ORDER BY created_at ASC
    `);

    res.json({ trends });
  } catch (error) {
    next(error);
  }
};

const addAnalyticsRecord = async (req, res, next) => {
  try {
    const { month, revenue, expenses, profit, jobs_completed } = req.body;

    await pool.query(`
      INSERT INTO analytics_data (month, revenue, expenses, profit, jobs_completed)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        revenue = VALUES(revenue),
        expenses = VALUES(expenses),
        profit = VALUES(profit),
        jobs_completed = VALUES(jobs_completed)
    `, [month, revenue, expenses, profit, jobs_completed]);

    res.json({ message: 'Analytics record updated successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAnalyticsData,
  getDashboardStats,
  getMonthlyTrends,
  addAnalyticsRecord
};
