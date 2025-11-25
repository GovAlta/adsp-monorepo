import { errors } from '@strapi/utils';
import { isNil } from 'lodash/fp';
import { ENTITY_ASSIGNEE_ATTRIBUTE } from '../constants/workflows.mjs';
import { getService, getAdminService } from '../utils/index.mjs';

const { ApplicationError } = errors;
var assignees = (({ strapi })=>{
    const metrics = getService('workflow-metrics', {
        strapi
    });
    return {
        async findEntityAssigneeId (id, model) {
            const entity = await strapi.db.query(model).findOne({
                where: {
                    id
                },
                populate: [
                    ENTITY_ASSIGNEE_ATTRIBUTE
                ],
                select: []
            });
            return entity?.[ENTITY_ASSIGNEE_ATTRIBUTE]?.id ?? null;
        },
        /**
     * Update the assignee of an entity
     */ async updateEntityAssignee (entityToUpdate, model, assigneeId) {
            const { documentId, locale } = entityToUpdate;
            if (!isNil(assigneeId)) {
                const userExists = await getAdminService('user', {
                    strapi
                }).exists({
                    id: assigneeId
                });
                if (!userExists) {
                    throw new ApplicationError(`Selected user does not exist`);
                }
            }
            const oldAssigneeId = await this.findEntityAssigneeId(entityToUpdate.id, model);
            metrics.sendDidEditAssignee(oldAssigneeId, assigneeId || null);
            const entity = await strapi.documents(model).update({
                documentId,
                locale,
                data: {
                    [ENTITY_ASSIGNEE_ATTRIBUTE]: assigneeId || null
                },
                populate: [
                    ENTITY_ASSIGNEE_ATTRIBUTE
                ],
                fields: []
            });
            // Update the `updated_at` field of the entity, so that the `status` is not considered `Modified`
            // NOTE: `updatedAt` is a protected attribute that can not be modified directly from the query layer
            //        hence the knex query builder is used here.
            const { tableName } = strapi.db.metadata.get(model);
            await strapi.db.connection(tableName).where({
                id: entityToUpdate.id
            }).update({
                updated_at: new Date(entityToUpdate.updatedAt)
            });
            return entity;
        }
    };
});

export { assignees as default };
//# sourceMappingURL=assignees.mjs.map
