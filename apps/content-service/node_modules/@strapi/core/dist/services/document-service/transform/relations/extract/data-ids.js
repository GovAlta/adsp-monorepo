'use strict';

var fp = require('lodash/fp');
var strapiUtils = require('@strapi/utils');
var i18n = require('../utils/i18n.js');
var dp = require('../utils/dp.js');
var mapRelation = require('../utils/map-relation.js');

const { isPolymorphic } = strapiUtils.relations;
/**
 * Load a relation documentId into the idMap.
 */ const addRelationDocId = fp.curry((idMap, source, targetUid, relation)=>{
    const targetLocale = i18n.getRelationTargetLocale(relation, {
        targetUid,
        sourceUid: source.uid,
        sourceLocale: source.locale
    });
    const targetStatus = dp.getRelationTargetStatus(relation, {
        targetUid,
        sourceUid: source.uid,
        sourceStatus: source.status
    });
    targetStatus.forEach((status)=>{
        idMap.add({
            uid: targetUid,
            documentId: relation.documentId,
            locale: targetLocale,
            status
        });
    });
});
/**
 * Iterate over all relations of a data object and extract all relational document ids.
 * Those will later be transformed to entity ids.
 */ const extractDataIds = (idMap, data, source)=>{
    return mapRelation.traverseEntityRelations(async ({ attribute, value })=>{
        if (!attribute) {
            return;
        }
        const isPolymorphicRelation = isPolymorphic(attribute);
        const addDocId = addRelationDocId(idMap, source);
        return mapRelation.mapRelation((relation)=>{
            if (!relation || !relation.documentId) {
                return relation;
            }
            // Regular relations will always target the same target
            // if its a polymorphic relation we need to get it from the data itself
            const targetUid = isPolymorphicRelation ? relation.__type : attribute.target;
            addDocId(targetUid, relation);
            // Handle positional arguments
            const position = relation.position;
            // The positional relation target uid can be different for polymorphic relations
            let positionTargetUid = targetUid;
            if (isPolymorphicRelation && position?.__type) {
                positionTargetUid = position.__type;
            }
            if (position?.before) {
                addDocId(positionTargetUid, {
                    ...relation,
                    ...position,
                    documentId: position.before
                });
            }
            if (position?.after) {
                addDocId(positionTargetUid, {
                    ...relation,
                    ...position,
                    documentId: position.after
                });
            }
            return relation;
        }, value);
    }, {
        schema: strapi.getModel(source.uid),
        getModel: strapi.getModel.bind(strapi)
    }, data);
};

exports.extractDataIds = extractDataIds;
//# sourceMappingURL=data-ids.js.map
