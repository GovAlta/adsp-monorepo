declare const locales: () => {
    find: (params?: any) => Promise<any[]>;
    findById: (id: any) => Promise<any>;
    findByCode: (code: any) => Promise<any>;
    create: (locale: any) => Promise<any>;
    update: (params: any, updates: any) => Promise<any>;
    count: (params?: any) => Promise<number>;
    setDefaultLocale: ({ code }: any) => Promise<void>;
    getDefaultLocale: () => Promise<unknown>;
    setIsDefault: (locales: any) => Promise<any>;
    delete: ({ id }: any) => Promise<any>;
    initDefaultLocale: () => Promise<void>;
};
type LocaleService = typeof locales;
export default locales;
export type { LocaleService };
//# sourceMappingURL=locales.d.ts.map