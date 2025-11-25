import type { Schema } from '@strapi/types';
declare const localizations: () => {
    syncNonLocalizedAttributes: (sourceEntry: any, model: Schema.ContentType) => Promise<void>;
};
type LocalizationsService = typeof localizations;
export default localizations;
export type { LocalizationsService };
//# sourceMappingURL=localizations.d.ts.map