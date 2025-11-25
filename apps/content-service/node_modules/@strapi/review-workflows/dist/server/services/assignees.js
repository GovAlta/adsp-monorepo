'use strict';

var utils = require('@strapi/utils');
var fp = require('lodash/fp');
var workflows = require('../constants/workflows.js');
var index = require('../utils/index.js');

const { ApplicationError } = utils.errors;
var assignees = (({ strapi })=>{
    const metrics = index.getService('workflow-metrics', {
        strapi
    });
    return {
        async findEntityAssigneeId (id, model) {
            const entity = await strapi.db.query(model).findOne({
                where: {
                    id
                },
                populate: [
                    workflows.ENTITY_ASSIGNEE_ATTRIBUTE
                ],
                select: []
            });
            return entity?.[workflows.ENTITY_ASSIGNEE_ATTRIBUTE]?.id ?? null;
        },
        /**
     * Update the assignee of an entity
     */ async updateEntityAssignee (entityToUpdate, model, assigneeId) {
            const { documentId, locale } = entityToUpdate;
            if (!fp.isNil(assigneeId)) {
                const userExists = await index.getAdminService('user', {
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
                    [workflows.ENTITY_ASSIGNEE_ATTRIBUTE]: assigneeId || null
                },
                populate: [
                    workflows.ENTITY_ASSIGNEE_ATTRIBUTE
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

module.exports = assignees;
//# sourceMappingURL=assignees.js.map
