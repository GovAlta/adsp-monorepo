import type { UID, Data, Core } from '@strapi/types';
import type { SettingsService } from '../services/settings';
import type { ReleaseService } from '../services/release';
import type { ReleaseActionService } from '../services/release-action';
type Services = {
    release: ReleaseService;
    'release-validation': any;
    scheduling: any;
    'release-action': ReleaseActionService;
    'event-manager': any;
    settings: SettingsService;
};
interface Action {
    contentType: UID.ContentType;
    documentId?: Data.DocumentID;
    locale?: string;
}
export declare const getService: <TName extends keyof Services>(name: TName, { strapi }: {
    strapi: Core.Strapi;
}) => Services[TName];
export declare const getDraftEntryValidStatus: ({ contentType, documentId, locale }: Action, { strapi }: {
    strapi: Core.Strapi;
}) => Promise<boolean>;
export declare const isEntryValid: (contentTypeUid: string, entry: any, { strapi }: {
    strapi: Core.Strapi;
}) => Promise<boolean>;
export declare const getEntry: ({ contentType, documentId, locale, populate, status, }: Action & {
    status?: 'draft' | 'published';
    populate: any;
}, { strapi }: {
    strapi: Core.Strapi;
}) => Promise<import("@strapi/types/dist/modules/documents").AnyDocument | null>;
export declare const getEntryStatus: (contentType: UID.ContentType, entry: Data.ContentType) => Promise<"draft" | "published" | "modified">;
export {};
//# sourceMappingURL=index.d.ts.map