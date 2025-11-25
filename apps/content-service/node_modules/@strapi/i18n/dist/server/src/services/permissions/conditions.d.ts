declare const _default: {
    conditions: {
        displayName: string;
        name: string;
        plugin: string;
        handler(user: any, options: any): true | {
            locale: {
                $in: any;
            };
        };
    }[];
    registerI18nConditions: () => Promise<void>;
};
export default _default;
//# sourceMappingURL=conditions.d.ts.map