import type { ComponentsDictionary, Document } from '../../../hooks/useDocument';
import type { Schema } from '@strapi/types';
type PartialSchema = Partial<Schema.Schema> & Pick<Schema.Schema, 'attributes'>;
type AnyData = Omit<Document, 'id'>;
/**
 * @internal Removes all the fields that are not allowed.
 */
declare const removeProhibitedFields: (prohibitedFields: Schema.Attribute.Kind[]) => (schema: PartialSchema, components?: ComponentsDictionary) => (data?: AnyData) => AnyData;
/**
 * @internal
 * @description Sets all relation values to an empty array.
 */
declare const prepareRelations: (schema: PartialSchema, components?: ComponentsDictionary) => (data?: AnyData) => AnyData;
/**
 * @internal
 * @description Adds a `__temp_key__` to each component and dynamiczone item. This gives us
 * a stable identifier regardless of its ids etc. that we can then use for drag and drop.
 */
declare const prepareTempKeys: (schema: PartialSchema, components?: ComponentsDictionary) => (data?: AnyData) => AnyData;
/**
 * @internal
 * @description Fields that don't exist in the schema like createdAt etc. are only on the first level (not nested),
 * as such we don't need to traverse the components to remove them.
 */
declare const removeFieldsThatDontExistOnSchema: (schema: PartialSchema) => (data: AnyData) => AnyData;
/**
 * @internal
 * @description Takes a document data structure (this could be from the API or a default form structure)
 * and applies consistent data transformations to it. This is also used when we add new components to the
 * form to ensure the data is correctly prepared from their default state e.g. relations are set to an empty array.
 */
declare const transformDocument: (schema: PartialSchema, components?: ComponentsDictionary) => (document: AnyData) => AnyData;
type HandleOptions = {
    schema?: Schema.ContentType | Schema.Component;
    initialValues?: AnyData;
    components?: Record<string, Schema.Component>;
};
type RemovedFieldPath = string;
/**
 * Removes values from the data object if their corresponding attribute has a
 * visibility condition that evaluates to false.
 *
 * @param {object} schema - The content type schema (with attributes).
 * @param {object} data - The data object to filter based on visibility.
 * @returns {object} A new data object with only visible fields retained.
 */
declare const handleInvisibleAttributes: (data: AnyData, { schema, initialValues, components }: HandleOptions, path?: string[], removedAttributes?: RemovedFieldPath[]) => {
    data: AnyData;
    removedAttributes: RemovedFieldPath[];
};
export { removeProhibitedFields, prepareRelations, prepareTempKeys, removeFieldsThatDontExistOnSchema, transformDocument, handleInvisibleAttributes, };
export type { AnyData };
