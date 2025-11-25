import type { Schema } from '@strapi/types';
/**
 *
 * Retrieves the relation type
 */
export declare const getRelationType: (relation: Schema.Attribute.RelationKind.Any, targetAttribute?: string | null) => Schema.Attribute.RelationKind.Any;
