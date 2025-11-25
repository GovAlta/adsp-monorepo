import type { AnyAttribute } from '../types';
interface DependentRow {
    contentTypeUid: string;
    contentType: string;
    attribute: string;
}
export declare const checkDependentRows: (contentTypes: Record<string, any>, fieldName: string) => DependentRow[];
export declare const formatCondition: (condition: any, availableFields: Array<{
    name: string;
    type: string;
}>, attributeName: string) => string;
export declare const getAvailableConditionFields: (attributes: AnyAttribute[], currentFieldName: string) => {
    name: string;
    type: "string" | "boolean" | "time" | "media" | "text" | "date" | "email" | "password" | "decimal" | "component" | "relation" | "biginteger" | "blocks" | "datetime" | "dynamiczone" | "enumeration" | "float" | "integer" | "json" | "richtext" | "timestamp" | "uid";
    enum: string[] | undefined;
}[];
export {};
