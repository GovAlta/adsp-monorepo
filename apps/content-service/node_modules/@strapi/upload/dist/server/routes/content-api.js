'use strict';

var z = require('zod/v4');
var utils = require('@strapi/utils');
var upload = require('./validation/upload.js');

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

const createRoutes = utils.createContentApiRoutesFactory(()=>{
    const validator = new upload.UploadRouteValidator(strapi);
    return [
        {
            method: 'POST',
            path: '/',
            handler: 'content-api.upload',
            request: {
                query: {
                    id: validator.fileId.optional()
                }
            },
            response: z__namespace.union([
                validator.file,
                validator.files
            ])
        },
        {
            method: 'GET',
            path: '/files',
            handler: 'content-api.find',
            request: {
                query: {
                    fields: validator.queryFields.optional(),
                    populate: validator.queryPopulate.optional(),
                    sort: validator.querySort.optional(),
                    pagination: validator.pagination.optional(),
                    filters: validator.filters.optional()
                }
            },
            response: validator.files
        },
        {
            method: 'GET',
            path: '/files/:id',
            handler: 'content-api.findOne',
            request: {
                params: {
                    id: validator.fileId
                },
                query: {
                    fields: validator.queryFields.optional(),
                    populate: validator.queryPopulate.optional()
                }
            },
            response: validator.file
        },
        {
            method: 'DELETE',
            path: '/files/:id',
            handler: 'content-api.destroy',
            request: {
                params: {
                    id: validator.fileId
                }
            },
            response: validator.file
        }
    ];
});
const routes = createRoutes;

exports.routes = routes;
//# sourceMappingURL=content-api.js.map
