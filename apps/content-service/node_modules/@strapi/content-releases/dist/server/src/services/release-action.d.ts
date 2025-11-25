/// <reference types="lodash" />
import type { Core, Modules, UID } from '@strapi/types';
import { RELEASE_ACTION_MODEL_UID } from '../constants';
import type { CreateReleaseAction, GetReleaseActions, ReleaseAction, ReleaseActionGroupBy, UpdateReleaseAction, DeleteReleaseAction } from '../../../shared/contracts/release-actions';
import type { Entity } from '../../../shared/types';
export interface Locale extends Entity {
    name: string;
    code: string;
}
declare const createReleaseActionService: ({ strapi }: {
    strapi: Core.Strapi;
}) => {
    create(releaseId: CreateReleaseAction.Request['params']['releaseId'], action: CreateReleaseAction.Request['body'], { disableUpdateReleaseStatus }?: {
        disableUpdateReleaseStatus?: boolean;
    }): Promise<any>;
    findPage(releaseId: GetReleaseActions.Request['params']['releaseId'], query?: GetReleaseActions.Request['query']): Promise<{
        results: any;
        pagination: {
            page: number;
            pageSize: number;
            pageCount: number;
            total: number;
        };
    }>;
    groupActions(actions: ReleaseAction[], groupBy: ReleaseActionGroupBy): Promise<import("lodash").Dictionary<(null | undefined)[]>>;
    getContentTypeModelsFromActions(actions: ReleaseAction[]): Promise<{} | undefined>;
    countActions(query: Modules.EntityService.Params.Pick<typeof RELEASE_ACTION_MODEL_UID, 'filters'>): Promise<number>;
    update(actionId: UpdateReleaseAction.Request['params']['actionId'], releaseId: UpdateReleaseAction.Request['params']['releaseId'], update: UpdateReleaseAction.Request['body']): Promise<any>;
    delete(actionId: DeleteReleaseAction.Request['params']['actionId'], releaseId: DeleteReleaseAction.Request['params']['releaseId']): Promise<any>;
    validateActionsByContentTypes(contentTypeUids: UID.ContentType[]): Promise<void>;
};
export type ReleaseActionService = ReturnType<typeof createReleaseActionService>;
export default createReleaseActionService;
//# sourceMappingURL=release-action.d.ts.map