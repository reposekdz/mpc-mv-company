
/**
 * Advanced API Features Utility
 * Provides pagination, sorting, filtering, and field selection for all endpoints
 */

class APIFeatures {
  constructor(query, queryParams, allowedFilters = [], allowedSorts = []) {
    this.query = query;
    this.queryParams = queryParams;
    this.allowedFilters = allowedFilters;
    this.allowedSorts = allowedSorts;
    this.params = [];
    this.pagination = {};
  }

  /**
   * Apply filtering with advanced operators: gt, gte, lt, lte, eq, ne, like
   * Example: ?price[gte]=100&status=active&name[like]=truck
   */
  filter() {
    const queryObj = { ...this.queryParams };
    const excludedFields = ['page', 'limit', 'sort', 'fields', 'search'];
    excludedFields.forEach(el => delete queryObj[el]);

    let filterStr = '';
    const filterParams = [];

    Object.keys(queryObj).forEach(key => {
      if (this.allowedFilters.length && !this.allowedFilters.includes(key)) return;

      const value = queryObj[key];

      if (typeof value === 'object' && value !== null) {
        // Advanced operators
        Object.keys(value).forEach(op => {
          const operatorMap = {
            'gt': '>',
            'gte': '>=',
            'lt': '<',
            'lte': '<=',
            'eq': '=',
            'ne': '!=',
            'like': 'ILIKE'
          };

          if (operatorMap[op]) {
            filterStr += filterStr ? ' AND ' : '';
            if (op === 'like') {
              filterStr += `${key} ${operatorMap[op]} $${this.params.length + filterParams.length + 1}`;
              filterParams.push(`%${value[op]}%`);
            } else {
              filterStr += `${key} ${operatorMap[op]} $${this.params.length + filterParams.length + 1}`;
              filterParams.push(value[op]);
            }
          }
        });
      } else {
        // Exact match
        filterStr += filterStr ? ' AND ' : '';
        filterStr += `${key} = $${this.params.length + filterParams.length + 1}`;
        filterParams.push(value);
      }
    });

    if (filterStr) {
      this.query += ` AND (${filterStr})`;
      this.params = [...this.params, ...filterParams];
    }

    return this;
  }

  /**
   * Apply sorting
   * Example: ?sort=-created_at,name (negative for DESC)
   */
  sort() {
    if (this.queryParams.sort) {
      const sortFields = this.queryParams.sort.split(',').map(field => {
        const isDesc = field.startsWith('-');
        const fieldName = isDesc ? field.slice(1) : field;
        
        if (this.allowedSorts.length && !this.allowedSorts.includes(fieldName)) {
          return null;
        }
        
        return `${fieldName} ${isDesc ? 'DESC' : 'ASC'}`;
      }).filter(Boolean);

      if (sortFields.length) {
        this.query += ` ORDER BY ${sortFields.join(', ')}`;
      }
    } else {
      this.query += ' ORDER BY created_at DESC';
    }

    return this;
  }

  /**
   * Apply pagination
   * Example: ?page=2&limit=20
   */
  paginate() {
    const page = parseInt(this.queryParams.page, 10) || 1;
    const limit = parseInt(this.queryParams.limit, 10) || 20;
    const offset = (page - 1) * limit;

    this.query += ` LIMIT $${this.params.length + 1} OFFSET $${this.params.length + 2}`;
    this.params.push(limit, offset);

    this.pagination = {
      page,
      limit,
      offset
    };

    return this;
  }

  /**
   * Get the final query and parameters
   */
  getQuery() {
    return {
      query: this.query,
      params: this.params,
      pagination: this.pagination
    };
  }

  /**
   * Build pagination metadata with total count
   */
  static async buildPaginationMeta(total, page, limit, baseUrl, queryParams) {
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    const buildUrl = (pageNum) => {
      const params = new URLSearchParams(queryParams);
      params.set('page', pageNum);
      params.set('limit', limit);
      return `${baseUrl}?${params.toString()}`;
    };

    return {
      total,
      page,
      limit,
      totalPages,
      hasNext,
      hasPrev,
      next: hasNext ? buildUrl(page + 1) : null,
      prev: hasPrev ? buildUrl(page - 1) : null,
      first: buildUrl(1),
      last: buildUrl(totalPages)
    };
  }
}

/**
 * Standard API response formatter
 */
const apiResponse = (res, data, meta = {}) => {
  return res.json({
    success: true,
    data,
    meta,
    timestamp: new Date().toISOString()
  });
};

/**
 * Standard API error formatter
 */
const apiError = (res, message, statusCode = 500, errors = []) => {
  return res.status(statusCode).json({
    success: false,
    error: message,
    errors,
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  APIFeatures,
  apiResponse,
  apiError
};
