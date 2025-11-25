import type { LocaleService } from '../services/locales';
import type { PermissionsService } from '../services/permissions';
import type { ContentTypesService } from '../services/content-types';
import type { MetricsService } from '../services/metrics';
import type { ISOLocalesService } from '../services/iso-locales';
import type { LocalizationsService } from '../services/localizations';
import type { SanitizeService } from '../services/sanitize';
type S = {
    permissions: PermissionsService;
    metrics: MetricsService;
    locales: LocaleService;
    localizations: LocalizationsService;
    ['iso-locales']: ISOLocalesService;
    ['content-types']: ContentTypesService;
    sanitize: SanitizeService;
};
declare const getCoreStore: () => {
    get(params?: Partial<{
        key: string;
        type?: string | undefined;
        environment?: string | undefined;
        name?: string | undefined;
        tag?: string | undefined;
    }> | undefined): Promise<unknown>;
    set(params?: Partial<{
        key: string;
        value: unknown;
        type?: string | undefined;
        environment?: string | undefined;
        name?: string | undefined;
        tag?: string | undefined;
    }> | undefined): Promise<void>;
    delete(params?: Partial<{
        key: string;
        type?: string | undefined;
        environment?: string | undefined;
        name?: string | undefined;
        tag?: string | undefined;
    }> | undefined): Promise<void>;
};
declare const getService: <T extends keyof S>(name: T) => ReturnType<S[T]>;
export { getService, getCoreStore };
//# sourceMappingURL=index.d.ts.map