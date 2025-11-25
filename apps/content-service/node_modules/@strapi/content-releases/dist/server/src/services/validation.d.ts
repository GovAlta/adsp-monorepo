import { errors } from '@strapi/utils';
import type { Core } from '@strapi/types';
import type { CreateRelease, UpdateRelease } from '../../../shared/contracts/releases';
import type { CreateReleaseAction } from '../../../shared/contracts/release-actions';
export declare class AlreadyOnReleaseError extends errors.ApplicationError<'AlreadyOnReleaseError'> {
    constructor(message: string);
}
declare const createReleaseValidationService: ({ strapi }: {
    strapi: Core.Strapi;
}) => {
    validateUniqueEntry(releaseId: CreateReleaseAction.Request['params']['releaseId'], releaseActionArgs: CreateReleaseAction.Request['body']): Promise<void>;
    validateEntryData(contentTypeUid: CreateReleaseAction.Request['body']['contentType'], entryDocumentId: CreateReleaseAction.Request['body']['entryDocumentId']): void;
    validatePendingReleasesLimit(): Promise<void>;
    validateUniqueNameForPendingRelease(name: CreateRelease.Request['body']['name'], id?: UpdateRelease.Request['params']['id']): Promise<void>;
    validateScheduledAtIsLaterThanNow(scheduledAt: CreateRelease.Request['body']['scheduledAt']): Promise<void>;
};
export default createReleaseValidationService;
//# sourceMappingURL=validation.d.ts.map