import { createAttributesSchema } from './mappers.mjs';
import { AbstractCoreRouteValidator } from './common.mjs';

// eslint-disable-next-line import/no-cycle
/**
 * A component validator for core content-type routes.
 *
 * Provides validation schemas and utilities for handling component-specific validation in content-type routes.
 *
 * @example
 * ```ts
 * const strapi = // ... strapi instance
 * const uid = 'api::article.article'
 * const validator = new CoreComponentRouteValidator(strapi, uid);
 *
 * // Get validation schema for a component entry
 * const componentSchema = validator.component;
 * ```
 */ class CoreComponentRouteValidator extends AbstractCoreRouteValidator {
    /**
   * Generates a comprehensive validation schema for a single component entry.
   *
   * Combines scalar fields and populatable fields into a single schema.
   *
   * @returns A schema for validating complete entries
   *
   * @example
   * ```ts
   * const validator = new CoreComponentRouteValidator(strapi, uid);
   * const entrySchema = validator.entry;
   * ```
   */ get entry() {
        const { _scalarFields, _populatableFields } = this;
        const entries = Object.entries({
            ..._scalarFields,
            ..._populatableFields
        });
        return createAttributesSchema(entries);
    }
}

export { CoreComponentRouteValidator };
//# sourceMappingURL=component.mjs.map
