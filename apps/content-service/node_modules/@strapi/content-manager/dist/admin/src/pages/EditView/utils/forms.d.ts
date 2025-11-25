import type { ComponentsDictionary, Document } from '../../../hooks/useDocument';
import type { Schema } from '@strapi/types';
type AnyData = Omit<Document, 'id'>;
/**
 * @internal Using the content-type schema & the components dictionary of the content-type,
 * creates a form with pre-filled default values. This is used when creating a new entry.
 */
declare const createDefaultForm: (contentType: Schema.Schema, components?: ComponentsDictionary) => AnyData;
export { createDefaultForm };
