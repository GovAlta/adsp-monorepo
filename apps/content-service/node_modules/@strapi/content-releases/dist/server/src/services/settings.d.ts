import type { Core } from '@strapi/types';
import type { Settings } from '../../../shared/contracts/settings';
declare const createSettingsService: ({ strapi }: {
    strapi: Core.Strapi;
}) => {
    update({ settings }: {
        settings: Settings;
    }): Promise<Settings>;
    find(): Promise<Settings>;
};
export type SettingsService = ReturnType<typeof createSettingsService>;
export default createSettingsService;
//# sourceMappingURL=settings.d.ts.map