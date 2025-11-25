'use strict';

var z = require('zod/v4');

function _interopNamespaceDefault(e) {
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  }
  n.default = e;
  return Object.freeze(n);
}

var z__namespace = /*#__PURE__*/_interopNamespaceDefault(z);

/**
 * Standard query parameter validators that can be reused across different route validators
 *
 * These schemas provide the basic structure validation for common Strapi API query parameters.
 * They can be used as building blocks for both generic validation and schema-aware validation.
 */ /**
 * Fields parameter validation
 * Supports: 'title', ['title', 'name'], or '*'
 */ const queryFieldsSchema = z__namespace.union([
    z__namespace.string(),
    z__namespace.array(z__namespace.string())
]).describe('Select specific fields to return in the response');
/**
 * Populate parameter validation
 * Supports: '*', 'relation', ['relation1', 'relation2'], or complex objects
 */ const queryPopulateSchema = z__namespace.union([
    z__namespace.literal('*'),
    z__namespace.string(),
    z__namespace.array(z__namespace.string()),
    z__namespace.record(z__namespace.string(), z__namespace.any())
]).describe('Specify which relations to populate in the response');
/**
 * Sort parameter validation
 * Supports: 'name', ['name', 'title'], { name: 'asc' }, or [{ name: 'desc' }]
 */ const querySortSchema = z__namespace.union([
    z__namespace.string(),
    z__namespace.array(z__namespace.string()),
    z__namespace.record(z__namespace.string(), z__namespace.enum([
        'asc',
        'desc'
    ])),
    z__namespace.array(z__namespace.record(z__namespace.string(), z__namespace.enum([
        'asc',
        'desc'
    ])))
]).describe('Sort the results by specified fields');
/**
 * Pagination parameter validation
 * Supports both page-based and offset-based pagination
 */ const paginationSchema = z__namespace.intersection(z__namespace.object({
    withCount: z__namespace.boolean().optional().describe('Include total count in response')
}), z__namespace.union([
    z__namespace.object({
        page: z__namespace.number().int().positive().describe('Page number (1-based)'),
        pageSize: z__namespace.number().int().positive().describe('Number of entries per page')
    }).describe('Page-based pagination'),
    z__namespace.object({
        start: z__namespace.number().int().min(0).describe('Number of entries to skip'),
        limit: z__namespace.number().int().positive().describe('Maximum number of entries to return')
    }).describe('Offset-based pagination')
])).describe('Pagination parameters');
/**
 * Filters parameter validation
 * Supports any object structure for filtering
 */ const filtersSchema = z__namespace.record(z__namespace.string(), z__namespace.any()).describe('Apply filters to the query');
/**
 * Locale parameter validation
 * Used for internationalization
 */ const localeSchema = z__namespace.string().describe('Specify the locale for localized content');
/**
 * Status parameter validation
 * Used for draft & publish functionality
 */ const statusSchema = z__namespace.enum([
    'draft',
    'published'
]).describe('Filter by publication status');
/**
 * Search query parameter validation
 * Used for text search functionality
 */ const searchQuerySchema = z__namespace.string().describe('Search query string');
/**
 * Complete collection of all standard query parameter schemas
 * This object provides easy access to all available query parameter validators
 */ const queryParameterSchemas = {
    fields: queryFieldsSchema,
    populate: queryPopulateSchema,
    sort: querySortSchema,
    pagination: paginationSchema,
    filters: filtersSchema,
    locale: localeSchema,
    status: statusSchema,
    _q: searchQuerySchema
};

exports.filtersSchema = filtersSchema;
exports.localeSchema = localeSchema;
exports.paginationSchema = paginationSchema;
exports.queryFieldsSchema = queryFieldsSchema;
exports.queryParameterSchemas = queryParameterSchemas;
exports.queryPopulateSchema = queryPopulateSchema;
exports.querySortSchema = querySortSchema;
exports.searchQuerySchema = searchQuerySchema;
exports.statusSchema = statusSchema;
//# sourceMappingURL=query-params.js.map
