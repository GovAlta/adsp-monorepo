import type { Schema } from '@strapi/types';
type Data = Record<keyof Schema.ContentType['attributes'], any>;
declare const cleanData: (data: Data, schema: Schema.ContentType, components: Record<string, Schema.Component>) => any;
export { cleanData };
