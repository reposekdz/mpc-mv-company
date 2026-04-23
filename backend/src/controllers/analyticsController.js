const { query } = require('../config/db');
const { apiResponse, apiError } = require('../utils/apiFeatures');

const getAnalyticsData = async (req, res, next) => {
  try {
    const result = await query(`SELECT * FROM analytics_data ORDER BY metric_date DESC, created_at DESC LIMIT 200`);
    return apiResponse(res, result.rows);
  } catch (error) {
    next(error);
  }
};

const getDashboardStats = async (req, res, next) => {
  try {
    const [jobsStats, trucksStats, employeesStats, meetingsStats, recentJobs, recentTrucks, recentMeetings] = await Promise.all([
      query(`SELECT COUNT(*) as total_jobs,
               SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END) as completed_jobs,
               SUM(CASE WHEN status='in_progress' THEN 1 ELSE 0 END) as active_jobs,
               COALESCE(SUM(budget),0) as total_budget
             FROM jobs`),
      query(`SELECT COUNT(*) as total_trucks,
               SUM(CASE WHEN status='available' THEN 1 ELSE 0 END) as available_trucks,
               SUM(CASE WHEN status='in_use' THEN 1 ELSE 0 END) as active_trucks,
               COALESCE(SUM(mileage),0) as total_mileage
             FROM trucks`),
      query(`SELECT COUNT(*) as total_employees,
               SUM(CASE WHEN status='active' THEN 1 ELSE 0 END) as active_employees,
               COALESCE(SUM(salary),0) as total_payroll
             FROM employees`),
      query(`SELECT COUNT(*) as total_meetings,
               SUM(CASE WHEN status='scheduled' THEN 1 ELSE 0 END) as upcoming_meetings
             FROM meetings WHERE start_time >= NOW()`),
      query(`SELECT id, title, status, created_at, 'job' as type FROM jobs ORDER BY created_at DESC LIMIT 5`),
      query(`SELECT id, name as title, status, created_at, 'truck' as type FROM trucks ORDER BY created_at DESC LIMIT 5`),
      query(`SELECT id, title, status, created_at, 'meeting' as type FROM meetings ORDER BY created_at DESC LIMIT 5`)
    ]);

    const allActivities = [
      ...recentJobs.rows,
      ...recentTrucks.rows,
      ...recentMeetings.rows
    ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 10);

    return apiResponse(res, {
      jobs: jobsStats.rows[0],
      trucks: trucksStats.rows[0],
      employees: employeesStats.rows[0],
      meetings: meetingsStats.rows[0],
      recentActivities: allActivities
    });
  } catch (error) {
    next(error);
  }
};

const getMonthlyTrends = async (req, res, next) => {
  try {
    const result = await query(`
      SELECT
        TO_CHAR(metric_date, 'YYYY-MM') as month,
        category,
        SUM(metric_value) as total_value
      FROM analytics_data
      WHERE metric_date >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY TO_CHAR(metric_date, 'YYYY-MM'), category
      ORDER BY month DESC
    `);
    return apiResponse(res, result.rows);
  } catch (error) {
    next(error);
  }
};

const addAnalyticsRecord = async (req, res, next) => {
  try {
    const { metric_name, metric_value, metric_date, category, subcategory, metadata } = req.body;

    const result = await query(
      `INSERT INTO analytics_data (metric_name, metric_value, metric_date, category, subcategory, metadata)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [metric_name, metric_value, metric_date || new Date().toISOString().split('T')[0],
       category, subcategory||null, metadata ? JSON.stringify(metadata) : null]
    );
    return apiResponse(res, result.rows[0]);
  } catch (error) {
    next(error);
  }
};

module.exports = { getAnalyticsData, getDashboardStats, getMonthlyTrends, addAnalyticsRecord };
