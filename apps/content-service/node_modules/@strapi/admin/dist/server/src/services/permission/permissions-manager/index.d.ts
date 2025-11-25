declare const _default: ({ ability, action, model }: any) => {
    validateQuery: (data: any, options?: {}) => Promise<unknown>;
    validateInput: (data: any, options?: {}) => Promise<unknown>;
    sanitizeOutput: (data: unknown, options?: any) => any;
    sanitizeInput: (data: unknown, options?: any) => any;
    sanitizeQuery: (data: unknown, options?: any) => any;
    ability: any;
    action: any;
    model: any;
    isAllowed: unknown;
    toSubject(target: any, subjectType?: any): any;
    pickPermittedFieldsOf(data: unknown, options?: {}): any;
    getQuery(queryAction?: any): unknown;
    addPermissionsQueryTo(query: any, action: unknown): any;
};
export default _default;
//# sourceMappingURL=index.d.ts.map