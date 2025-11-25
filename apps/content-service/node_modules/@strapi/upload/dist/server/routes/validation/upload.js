'use strict';

var utils = require('@strapi/utils');
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
 * UploadRouteValidator provides validation for upload/file routes.
 *
 * Extends the AbstractRouteValidator to inherit common query parameter validation
 * while adding file-specific validation schemas.
 */ class UploadRouteValidator extends utils.AbstractRouteValidator {
    /**
   * File schema for upload responses
   * Defines the structure of a file object returned by the upload API
   */ get file() {
        return z__namespace.object({
            id: this.fileId,
            documentId: z__namespace.uuid(),
            name: z__namespace.string(),
            alternativeText: z__namespace.string().nullable().optional(),
            caption: z__namespace.string().nullable().optional(),
            width: z__namespace.number().int().optional(),
            height: z__namespace.number().int().optional(),
            formats: z__namespace.record(z__namespace.string(), z__namespace.unknown()).optional(),
            hash: z__namespace.string(),
            ext: z__namespace.string().optional(),
            mime: z__namespace.string(),
            size: z__namespace.number(),
            url: z__namespace.string(),
            previewUrl: z__namespace.string().nullable().optional(),
            folder: z__namespace.number().optional(),
            folderPath: z__namespace.string(),
            provider: z__namespace.string(),
            provider_metadata: z__namespace.record(z__namespace.string(), z__namespace.unknown()).nullable().optional(),
            createdAt: z__namespace.string(),
            updatedAt: z__namespace.string(),
            createdBy: z__namespace.number().optional(),
            updatedBy: z__namespace.number().optional()
        });
    }
    /**
   * Array of files schema
   */ get files() {
        return z__namespace.array(this.file);
    }
    /**
   * File ID parameter validation
   */ get fileId() {
        return z__namespace.number().int().positive();
    }
    /**
   * Upload request body schema for single file uploads
   */ get uploadBody() {
        return z__namespace.object({
            fileInfo: z__namespace.object({
                name: z__namespace.string().optional(),
                alternativeText: z__namespace.string().optional(),
                caption: z__namespace.string().optional()
            }).optional()
        });
    }
    /**
   * Upload request body schema for multiple file uploads
   */ get multiUploadBody() {
        return z__namespace.object({
            fileInfo: z__namespace.array(z__namespace.object({
                name: z__namespace.string().optional(),
                alternativeText: z__namespace.string().optional(),
                caption: z__namespace.string().optional()
            })).optional()
        });
    }
    constructor(strapi){
        super();
        this._strapi = strapi;
    }
}

exports.UploadRouteValidator = UploadRouteValidator;
//# sourceMappingURL=upload.js.map
