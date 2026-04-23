/**
 * Advanced API Features Utility
 * Provides pagination, sorting, filtering for PostgreSQL endpoints
 */

class APIFeatures {
  constructor(query, queryParams, allowedFilters = [], allowedSorts = [], paramOffset = 0) {
    this.query = query;
    this.queryParams = queryParams;
    this.allowedFilters = allowedFilters;
    this.allowedSorts = allowedSorts;
    this.params = [];
    this.pagination = {};
    this.paramOffset = paramOffset;
  }

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
            const idx = this.paramOffset + this.params.length + filterParams.length + 1;
            if (op === 'like') {
              filterStr += `${key} ${operatorMap[op]} $${idx}`;
              filterParams.push(`%${value[op]}%`);
            } else {
              filterStr += `${key} ${operatorMap[op]} $${idx}`;
              filterParams.push(value[op]);
            }
          }
        });
      } else {
        filterStr += filterStr ? ' AND ' : '';
        const idx = this.paramOffset + this.params.length + filterParams.length + 1;
        filterStr += `${key} = $${idx}`;
        filterParams.push(value);
      }
    });

    if (filterStr) {
      this.query += ` AND (${filterStr})`;
      this.params = [...this.params, ...filterParams];
    }

    return this;
  }

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

  paginate() {
    const page = parseInt(this.queryParams.page, 10) || 1;
    const limit = Math.min(parseInt(this.queryParams.limit, 10) || 20, 100);
    const offset = (page - 1) * limit;

    const baseIdx = this.paramOffset + this.params.length;
    this.query += ` LIMIT $${baseIdx + 1} OFFSET $${baseIdx + 2}`;
    this.params.push(limit, offset);

    this.pagination = { page, limit, offset };

    return this;
  }

  getQuery() {
    return {
      sql: this.query,
      params: this.params,
      pagination: this.pagination
    };
  }

  static async buildPaginationMeta(total, page, limit, baseUrl, queryParams) {
    const totalPages = Math.ceil(total / limit) || 1;
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
      prev: hasPrev ? buildUrl(page - 1) : null
    };
  }
}

const apiResponse = (res, data, meta = {}, status = 200) => {
  return res.status(status).json({
    success: true,
    data,
    meta,
    timestamp: new Date().toISOString()
  });
};

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
