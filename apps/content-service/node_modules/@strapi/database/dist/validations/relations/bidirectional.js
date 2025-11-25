'use strict';

var _ = require('lodash/fp');
var index = require('../../utils/identifiers/index.js');

const getLinksWithoutMappedBy = (db)=>{
    const relationsToUpdate = {};
    db.metadata.forEach((modelMetadata)=>{
        const attributes = modelMetadata.attributes;
        // For each relation attribute, add the joinTable name to tablesToUpdate
        Object.values(attributes).forEach((attribute)=>{
            if (attribute.type !== 'relation') {
                return;
            }
            if ('inversedBy' in attribute && attribute.inversedBy) {
                const invRelation = db.metadata.get(attribute.target).attributes[attribute.inversedBy];
                // Both relations use inversedBy.
                if ('inversedBy' in invRelation && invRelation.inversedBy) {
                    relationsToUpdate[attribute.joinTable.name] = {
                        relation: attribute,
                        invRelation: invRelation
                    };
                }
            }
        });
    });
    return Object.values(relationsToUpdate);
};
const isLinkTableEmpty = async (db, linkTableName)=>{
    // If the table doesn't exist, it's empty
    const exists = await db.getSchemaConnection().hasTable(linkTableName);
    if (!exists) return true;
    const result = await db.getConnection().from(linkTableName).count('* as count');
    return Number(result[0].count) === 0;
};
/**
 * Validates bidirectional relations before starting the server.
 * - If both sides use inversedBy, one of the sides must switch to mappedBy.
 *    When this happens, two join tables exist in the database.
 *    This makes sure you switch the side which does not delete any data.
 *
 * @param {*} db
 * @return {*}
 */ const validateBidirectionalRelations = async (db)=>{
    const invalidLinks = getLinksWithoutMappedBy(db);
    for (const { relation, invRelation } of invalidLinks){
        const modelMetadata = db.metadata.get(invRelation.target);
        const invModelMetadata = db.metadata.get(relation.target);
        // Generate the join table name based on the relation target table and attribute name.
        const joinTableName = index.identifiers.getJoinTableName(_.snakeCase(modelMetadata.tableName), _.snakeCase(invRelation.inversedBy));
        const inverseJoinTableName = index.identifiers.getJoinTableName(_.snakeCase(invModelMetadata.tableName), _.snakeCase(relation.inversedBy));
        const joinTableEmpty = await isLinkTableEmpty(db, joinTableName);
        const inverseJoinTableEmpty = await isLinkTableEmpty(db, inverseJoinTableName);
        if (joinTableEmpty) {
            process.emitWarning(`Error on attribute "${invRelation.inversedBy}" in model "${modelMetadata.singularName}" (${modelMetadata.uid}).` + ` Please modify your ${modelMetadata.singularName} schema by renaming the key "inversedBy" to "mappedBy".` + ` Ex: { "inversedBy": "${relation.inversedBy}" } -> { "mappedBy": "${relation.inversedBy}" }`);
        } else if (inverseJoinTableEmpty) {
            // Its safe to delete the inverse join table
            process.emitWarning(`Error on attribute "${relation.inversedBy}" in model "${invModelMetadata.singularName}" (${invModelMetadata.uid}).` + ` Please modify your ${invModelMetadata.singularName} schema by renaming the key "inversedBy" to "mappedBy".` + ` Ex: { "inversedBy": "${invRelation.inversedBy}" } -> { "mappedBy": "${invRelation.inversedBy}" }`);
        } else ;
    }
};

exports.validateBidirectionalRelations = validateBidirectionalRelations;
//# sourceMappingURL=bidirectional.js.map
