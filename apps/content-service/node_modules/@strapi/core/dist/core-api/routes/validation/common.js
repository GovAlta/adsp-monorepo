'use strict';

var strapiUtils = require('@strapi/utils');
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
 * AbstractCoreRouteValidator provides the foundation for validating and managing core routes within a Strapi context for a specific model.
 *
 * This abstract class extends the base AbstractRouteValidator from utils to add schema-aware validation
 * logic for scalar and populatable fields defined in a model schema.
 *
 * It uses runtime information about Strapi models to derive and expose schema validations.
 *
 * @template {UID.Schema} T Representing the schema identifier to be validated.
 */ class AbstractCoreRouteValidator extends strapiUtils.AbstractRouteValidator {
    /**
   * Retrieves an enum schema constructed from the keys of the scalar fields.
   *
   * @return A Zod enum containing the keys from the scalar fields.
   */ get scalarFieldsEnum() {
        return z__namespace.enum(Object.keys(this._scalarFields));
    }
    /**
   * Retrieves an enum schema constructed from the keys of fields that can be populated (relations, components, files, etc.)
   *
   * @return A ZodEnum object containing the list of populatable field keys.
   */ get populatableFieldsEnum() {
        return z__namespace.enum(Object.keys(this._populatableFields));
    }
    /**
   * Retrieves an array representation of the scalar fields.
   *
   * @return An array containing the scalar fields as defined by {@link scalarFieldsEnum}.
   */ get scalarFieldsArray() {
        return z__namespace.array(this.scalarFieldsEnum);
    }
    /**
   * Retrieves an array of populatable fields.
   *
   * @return A Zod array schema representing the available populatable fields as defined by {@link populatableFieldsEnum}.
   */ get populatableFieldsArray() {
        return z__namespace.array(this.populatableFieldsEnum);
    }
    /**
   * Retrieves the schema associated with the current model.
   *
   * The schema represents the structural definition of the model,
   * as retrieved from the Strapi model associated with the given UID.
   *
   * @return The schema of the model retrieved from Strapi.
   */ get _schema() {
        return this._strapi.getModel(this._uid);
    }
    /**
   * Retrieves scalar fields from the object's schema attributes.
   *
   * Filters the schema attributes to include only those that are scalar and not private.
   *
   * @return An object composed of scalar fields from the schema attributes.
   */ get _scalarFields() {
        const attributes = Object.entries(this._schema.attributes);
        const scalarEntries = attributes.filter(([, attribute])=>strapiUtils.contentTypes.isScalarAttribute(attribute)).filter(([attributeName])=>!strapiUtils.contentTypes.isPrivateAttribute(this._schema, attributeName));
        return Object.fromEntries(scalarEntries);
    }
    /**
   * Retrieves the populatable fields from the schema attributes.
   *
   * Filters the schema attributes to include only those that are populatable and not private.
   *
   * @return An object containing the populatable fields derived from the schema attributes.
   */ get _populatableFields() {
        const attributes = Object.entries(this._schema.attributes);
        const populatableEntries = attributes.filter(([, attribute])=>!strapiUtils.contentTypes.isScalarAttribute(attribute)).filter(([attributeName])=>!strapiUtils.contentTypes.isPrivateAttribute(this._schema, attributeName));
        return Object.fromEntries(populatableEntries);
    }
    /**
   * Creates a Zod schema as a record with scalar fields as keys and the specified type as values.
   *
   * @param type - The Zod type to use for the record's values.
   * @return A Zod record schema with scalar fields as keys and the specified type as values.
   */ fieldRecord(type) {
        return z__namespace.record(this.scalarFieldsEnum, type);
    }
    /**
   * Protected constructor for initializing the class with the provided Strapi instance and unique identifier (UID).
   *
   * @param strapi The Strapi instance to be used.
   * @param uid The unique identifier for the instance.
   */ constructor(strapi, uid){
        super();
        this._strapi = strapi;
        this._uid = uid;
    }
}

exports.AbstractCoreRouteValidator = AbstractCoreRouteValidator;
//# sourceMappingURL=common.js.map
