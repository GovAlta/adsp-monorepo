declare const isListable: (schema: any, name: any) => boolean;
declare const isSortable: (schema: any, name: any) => boolean;
declare const isSearchable: (schema: any, name: any) => boolean;
declare const isVisible: (schema: any, name: any) => boolean;
declare const isRelation: (attribute: any) => boolean;
declare const hasRelationAttribute: (schema: any, name: any) => boolean;
declare const hasEditableAttribute: (schema: any, name: any) => boolean;
declare const getDefaultMainField: (schema: any) => string;
/**
 * Returns list of all sortable attributes for a given content type schema
 * TODO V5: Refactor non visible fields to be a part of content-manager schema so we can use isSortable instead
 * @param {*} schema
 * @returns
 */
declare const getSortableAttributes: (schema: any) => string[];
export { isSortable, isVisible, isSearchable, isRelation, isListable, hasEditableAttribute, hasRelationAttribute, getDefaultMainField, getSortableAttributes, };
//# sourceMappingURL=attributes.d.ts.map