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
 * A validator for i18n locale routes.
 *
 */ class I18nLocaleRouteValidator {
    /**
   * Generates a validation schema for a single locale.
   *
   * @returns A schema for validating locale objects
   */ get locale() {
        return z__namespace.object({
            id: z__namespace.number().int().positive(),
            documentId: z__namespace.string().uuid(),
            name: z__namespace.string(),
            code: z__namespace.string().length(2, 'Locale code must be exactly 2 characters'),
            createdAt: z__namespace.string(),
            updatedAt: z__namespace.string(),
            publishedAt: z__namespace.string().nullable(),
            isDefault: z__namespace.boolean()
        });
    }
    /**
   * Generates a validation schema for an array of locales
   *
   * @returns A schema for validating arrays of locales
   */ get locales() {
        return z__namespace.array(this.locale);
    }
    constructor(strapi){
        this._strapi = strapi;
    }
}

exports.I18nLocaleRouteValidator = I18nLocaleRouteValidator;
//# sourceMappingURL=locale.js.map
