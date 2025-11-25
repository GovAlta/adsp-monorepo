import type { Component } from '../../../shared/contracts/components';
import type { ContentType } from '../../../shared/contracts/content-types';
type ComponentsDictionary = Record<string, Component>;
/**
 * @internal
 * @description Given a model UID, return the schema and the schemas
 * of the associated components within said model's schema. A wrapper
 * implementation around the `useGetInitialDataQuery` with a unique
 * `selectFromResult` function to memoize the calculation.
 *
 * If no model is provided, the hook will return all the schemas.
 */
declare const useContentTypeSchema: (model?: string) => {
    components: ComponentsDictionary;
    schema: ContentType | undefined;
    schemas: ContentType[];
    isLoading: boolean;
};
/**
 * @internal
 * @description Extracts the components used in a content type's attributes recursively.
 */
declare const extractContentTypeComponents: (attributes?: ContentType['attributes'], allComponents?: ComponentsDictionary) => ComponentsDictionary;
export { useContentTypeSchema, extractContentTypeComponents };
export type { ComponentsDictionary };
