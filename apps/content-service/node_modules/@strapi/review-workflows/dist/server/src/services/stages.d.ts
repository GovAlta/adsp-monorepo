import type { Core, UID } from '@strapi/types';
declare const _default: ({ strapi }: {
    strapi: Core.Strapi;
}) => {
    find({ workflowId, populate }: any): Promise<any[]>;
    findById(id: string | number, { populate }?: any): Promise<any>;
    createMany(stagesList: any, { fields }?: any): Promise<any[]>;
    update(srcStage: any, destStage: any): Promise<any>;
    delete(stage: any): Promise<any>;
    deleteMany(stages: any): Promise<import("@strapi/database/dist/types").CountResult>;
    deleteStagePermissions(stages: any): Promise<void>;
    count({ workflowId }?: any): Promise<number>;
    replaceStages(srcStages: any, destStages: any, contentTypesToMigrate?: never[]): Promise<any>;
    /**
     * Update the stage of an entity
     */
    updateEntity(entityToUpdate: {
        id: number | string;
        documentId: string;
        locale: string;
        updatedAt: string;
    }, model: UID.ContentType, stageId: any): Promise<import("@strapi/types/dist/modules/documents").AnyDocument | null>;
    /**
     * Updates entity stages of a content type:
     *  - If fromStageId is undefined, all entities with an existing stage will be assigned the new stage
     *  - If fromStageId is null, all entities without a stage will be assigned the new stage
     *  - If fromStageId is a number, all entities with that stage will be assigned the new stage
     *
     * For performance reasons we use knex queries directly.
     *
     * @param {string} contentTypeUID
     * @param {number | undefined | null} fromStageId
     * @param {number} toStageId
     * @param {import('knex').Knex.Transaction} trx
     * @returns
     */
    updateEntitiesStage(contentTypeUID: any, { fromStageId, toStageId }: any): Promise<number | number[]>;
    /**
     * Deletes all entity stages of a content type
     * @param {string} contentTypeUID
     * @returns
     */
    deleteAllEntitiesStage(contentTypeUID: any): Promise<number>;
};
export default _default;
//# sourceMappingURL=stages.d.ts.map