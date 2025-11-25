/// <reference types="lodash" />
declare const _default: {
    permissions: () => {
        actions: {
            actions: ({
                section: string;
                category: string;
                subCategory: string;
                pluginName: string;
                displayName: string;
                uid: string;
                aliases?: undefined;
            } | {
                section: string;
                category: string;
                subCategory: string;
                pluginName: string;
                displayName: string;
                uid: string;
                aliases: {
                    actionId: string;
                    subjects: string[];
                }[];
            })[];
            registerI18nActions: () => Promise<void>;
            registerI18nActionsHooks: () => void;
            updateActionsProperties: () => void;
            syncSuperAdminPermissionsWithLocales: () => Promise<void>;
        };
        sectionsBuilder: {
            localesPropertyHandler: ({ action, section }: any) => Promise<void>;
            registerLocalesPropertyHandler: () => void;
        };
        engine: {
            willRegisterPermission: (context: any) => void;
            registerI18nPermissionsHandlers: () => void;
        };
    };
    metrics: () => {
        sendDidInitializeEvent: () => Promise<void>;
        sendDidUpdateI18nLocalesEvent: () => Promise<void>;
    };
    localizations: () => {
        syncNonLocalizedAttributes: (sourceEntry: any, model: import("@strapi/types/dist/struct").ContentTypeSchema) => Promise<void>;
    };
    locales: () => {
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
    sanitize: ({ strapi }: {
        strapi: import("@strapi/types/dist/core").Strapi;
    }) => {
        sanitizeLocalizationFields: import("lodash").CurriedFunction2<import("@strapi/types/dist/struct").ContentTypeSchema | import("@strapi/types/dist/struct").ComponentSchema, import("@strapi/types/dist/data").Entity<import("@strapi/types/dist/uid").Schema, string>, Promise<import("@strapi/utils/dist/types").Data>>;
    };
    'iso-locales': () => {
        getIsoLocales: () => {
            code: string;
            name: string;
        }[];
    };
    'content-types': () => {
        isLocalizedContentType: (model: any) => boolean;
        getValidLocale: (locale: any) => Promise<any>;
        getLocalizedAttributes: (model: any) => string[];
        getNonLocalizedAttributes: (model: any) => string[];
        copyNonLocalizedAttributes: (model: any, entry: any) => any;
        fillNonLocalizedAttributes: (entry: any, relatedEntry: any, { model }: any) => void;
        getNestedPopulateOfNonLocalizedAttributes: (modelUID: any) => string[];
    };
};
export default _default;
//# sourceMappingURL=index.d.ts.map