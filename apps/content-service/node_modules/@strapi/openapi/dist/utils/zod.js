'use strict';

var node_crypto = require('node:crypto');
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
 * Converts a Zod schema to an OpenAPI Schema Object.
 *
 * @description
 * Takes a Zod schema and converts it into an OpenAPI Schema Object (v3.1).
 * It uses a local registry to handle the conversion process and generates the appropriate
 * OpenAPI components.
 *
 * @param zodSchema - The Zod schema to convert to OpenAPI format. Can be any valid Zod schema.
 *
 * @returns An OpenAPI Schema Object representing the input Zod schema structure.
 * If the conversion cannot be completed, returns undefined.
 *
 * @example
 * ```typescript
 * import * as z from 'zod/v4';
 *
 * // Create a Zod schema
 * const userSchema = z.object({
 *   id: z.number(),
 *   name: z.string(),
 *   email: z.string().email()
 * });
 *
 * // Convert to OpenAPI schema
 * const openAPISchema = zodToOpenAPI(userSchema);
 * ```
 */ const zodToOpenAPI = (zodSchema)=>{
    try {
        const id = node_crypto.randomUUID();
        const registry = z__namespace.registry();
        // Add the schema to the local registry with a custom, unique ID
        registry.add(zodSchema, {
            id
        });
        // Copy the global registry definitions into the local registry to make sure references are resolved
        // This prevent "__shared" definitions from being created
        for (const [key, value] of z__namespace.globalRegistry._idmap){
            registry.add(value, {
                id: key
            });
        }
        // Generate the schemas and only return the one we want, transform the URI path to be OpenAPI compliant
        const { schemas } = z__namespace.toJSONSchema(registry, {
            uri: toComponentsPath
        });
        // TODO: make sure it's compliant
        return schemas[id];
    } catch (e) {
        throw new Error("Couldn't transform the zod schema into an OpenAPI schema");
    }
};
/**
 * Generates a path string for referencing a component schema by its identifier.
 *
 * @param id - The identifier of the component schema.
 * @returns The constructed path string for the specified component schema.
 */ const toComponentsPath = (id)=>`#/components/schemas/${id}`;

exports.toComponentsPath = toComponentsPath;
exports.zodToOpenAPI = zodToOpenAPI;
//# sourceMappingURL=zod.js.map
