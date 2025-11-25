import type { Core, UID } from '@strapi/types';
import { AbstractRouteValidator } from '@strapi/utils';
import * as z from 'zod/v4';
/**
 * AbstractCoreRouteValidator provides the foundation for validating and managing core routes within a Strapi context for a specific model.
 *
 * This abstract class extends the base AbstractRouteValidator from utils to add schema-aware validation
 * logic for scalar and populatable fields defined in a model schema.
 *
 * It uses runtime information about Strapi models to derive and expose schema validations.
 *
 * @template {UID.Schema} T Representing the schema identifier to be validated.
 */
export declare abstract class AbstractCoreRouteValidator<T extends UID.Schema> extends AbstractRouteValidator {
    /**
     * The `_strapi` variable serves as a reference to the core Strapi instance.
     * It is used for interacting with the loaded model.
     */
    protected readonly _strapi: Core.Strapi;
    /**
     * A unique identifier used to represent a model within Strapi.
     *
     * The type of the identifier is generic to allow flexibility and ensure type safety
     * when working with either content-types or components.
     */
    protected readonly _uid: T;
    /**
     * Protected constructor for initializing the class with the provided Strapi instance and unique identifier (UID).
     *
     * @param strapi The Strapi instance to be used.
     * @param uid The unique identifier for the instance.
     */
    constructor(strapi: Core.Strapi, uid: T);
    /**
     * Retrieves an enum schema constructed from the keys of the scalar fields.
     *
     * @return A Zod enum containing the keys from the scalar fields.
     */
    get scalarFieldsEnum(): z.ZodEnum<{
        [x: string]: string;
    }>;
    /**
     * Retrieves an enum schema constructed from the keys of fields that can be populated (relations, components, files, etc.)
     *
     * @return A ZodEnum object containing the list of populatable field keys.
     */
    get populatableFieldsEnum(): z.ZodEnum<{
        [x: string]: string;
    }>;
    /**
     * Retrieves an array representation of the scalar fields.
     *
     * @return An array containing the scalar fields as defined by {@link scalarFieldsEnum}.
     */
    get scalarFieldsArray(): z.ZodArray<z.ZodEnum<{
        [x: string]: string;
    }>>;
    /**
     * Retrieves an array of populatable fields.
     *
     * @return A Zod array schema representing the available populatable fields as defined by {@link populatableFieldsEnum}.
     */
    get populatableFieldsArray(): z.ZodArray<z.ZodEnum<{
        [x: string]: string;
    }>>;
    /**
     * Retrieves the schema associated with the current model.
     *
     * The schema represents the structural definition of the model,
     * as retrieved from the Strapi model associated with the given UID.
     *
     * @return The schema of the model retrieved from Strapi.
     */
    protected get _schema(): T extends UID.ContentType ? import("@strapi/types/dist/schema").ContentType<T> : T extends `${string}.${string}` ? import("@strapi/types/dist/schema").Component<T> : never;
    /**
     * Retrieves scalar fields from the object's schema attributes.
     *
     * Filters the schema attributes to include only those that are scalar and not private.
     *
     * @return An object composed of scalar fields from the schema attributes.
     */
    protected get _scalarFields(): {
        [k: string]: import("@strapi/types/dist/schema/attribute").AnyAttribute;
    };
    /**
     * Retrieves the populatable fields from the schema attributes.
     *
     * Filters the schema attributes to include only those that are populatable and not private.
     *
     * @return An object containing the populatable fields derived from the schema attributes.
     */
    protected get _populatableFields(): {
        [k: string]: import("@strapi/types/dist/schema/attribute").AnyAttribute;
    };
    /**
     * Creates a Zod schema as a record with scalar fields as keys and the specified type as values.
     *
     * @param type - The Zod type to use for the record's values.
     * @return A Zod record schema with scalar fields as keys and the specified type as values.
     */
    fieldRecord(type: z.ZodTypeAny): z.ZodRecord<z.ZodEnum<{
        [x: string]: string;
    }>, z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>>;
}
//# sourceMappingURL=common.d.ts.map