import isoLocales from './iso-locales.json';
/**
 * Returns the default locale based either on env var or english
 * @returns {string}
 */
declare const getInitLocale: () => {
    code: string;
    name: string;
};
declare const DEFAULT_LOCALE: {
    code: string;
    name: string;
};
export { isoLocales, DEFAULT_LOCALE, getInitLocale };
//# sourceMappingURL=index.d.ts.map