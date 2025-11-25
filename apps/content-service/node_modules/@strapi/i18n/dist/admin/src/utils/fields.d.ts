declare const LOCALIZED_FIELDS: string[];
declare const doesPluginOptionsHaveI18nLocalized: (opts?: object) => opts is {
    i18n: {
        localized: boolean;
    };
};
export { LOCALIZED_FIELDS, doesPluginOptionsHaveI18nLocalized };
