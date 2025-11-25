'use strict';

/*
 * Utility to sanitize content API route objects for safe JSON serialization.
 * Removes Zod validation fields (request/response) for safe serialization.
 *
 * NOTE: some content API routes are returned to the admin panel e.g. to
 * populate the users and permissions roles page. We need to ensure that the
 * routes can be serialized to JSON without errors.
 */ const sanitizeRouteForSerialization = ({ request, response, ...rest })=>rest;
const sanitizeRoutesArrayForSerialization = (routes)=>routes.filter((route)=>!!route && typeof route === 'object').map(sanitizeRouteForSerialization);
const sanitizeRoutesMapForSerialization = (map)=>Object.entries(map).reduce((acc, [key, value])=>({
            ...acc,
            [key]: Array.isArray(value) ? sanitizeRoutesArrayForSerialization(value) : value
        }), {});

exports.sanitizeRouteForSerialization = sanitizeRouteForSerialization;
exports.sanitizeRoutesArrayForSerialization = sanitizeRoutesArrayForSerialization;
exports.sanitizeRoutesMapForSerialization = sanitizeRoutesMapForSerialization;
//# sourceMappingURL=route-serialization.js.map
