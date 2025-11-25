/// <reference types="date-fns" />
import * as locales from 'date-fns/locale';
type LocaleName = keyof typeof locales;
/**
 * Returns a valid date-fns locale name from a Strapi Admin locale.
 * Defaults to 'enUS' if the locale is not found.
 */
declare const getDateFnsLocaleName: (locale: string) => LocaleName;
export { getDateFnsLocaleName };
