import { curry } from 'lodash/fp';
import { relations } from '@strapi/utils';
import { getRelationTargetLocale } from '../utils/i18n.mjs';
import { getRelationTargetStatus } from '../utils/dp.mjs';
import { traverseEntityRelations as traverseEntityRelationsCurried, mapRelation as mapRelationCurried } from '../utils/map-relation.mjs';

const { isPolymorphic } = relations;
/**
 * Load a relation documentId into the idMap.
 */ const addRelationDocId = curry((idMap, source, targetUid, relation)=>{
    const targetLocale = getRelationTargetLocale(relation, {
        targetUid,
        sourceUid: source.uid,
        sourceLocale: source.locale
    });
    const targetStatus = getRelationTargetStatus(relation, {
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
    return traverseEntityRelationsCurried(async ({ attribute, value })=>{
        if (!attribute) {
            return;
        }
        const isPolymorphicRelation = isPolymorphic(attribute);
        const addDocId = addRelationDocId(idMap, source);
        return mapRelationCurried((relation)=>{
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

export { extractDataIds };
//# sourceMappingURL=data-ids.mjs.map
