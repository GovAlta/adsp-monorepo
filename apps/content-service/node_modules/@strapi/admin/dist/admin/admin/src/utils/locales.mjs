import * as locales from 'date-fns/locale';

/**
 * Returns a valid date-fns locale name from a Strapi Admin locale.
 * Defaults to 'enUS' if the locale is not found.
 */ const getDateFnsLocaleName = (locale)=>{
    if (Object.keys(locales).includes(locale)) {
        return locale;
    }
    return 'enUS';
};

export { getDateFnsLocaleName };
//# sourceMappingURL=locales.mjs.map
