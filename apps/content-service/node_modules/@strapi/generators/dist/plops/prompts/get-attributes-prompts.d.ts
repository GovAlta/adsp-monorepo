interface AttributeAnswer {
    attributeName: string;
    attributeType: (typeof DEFAULT_TYPES)[number];
    enum?: string;
    multiple?: boolean;
}
declare const DEFAULT_TYPES: readonly ["media", "string", "text", "richtext", "json", "enumeration", "password", "email", "integer", "biginteger", "float", "decimal", "date", "time", "datetime", "timestamp", "boolean"];
declare const getAttributesPrompts: (inquirer: any) => Promise<AttributeAnswer[]>;
export default getAttributesPrompts;
//# sourceMappingURL=get-attributes-prompts.d.ts.map