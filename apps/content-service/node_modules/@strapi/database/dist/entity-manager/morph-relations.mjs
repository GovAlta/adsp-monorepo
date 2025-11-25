import { curry, groupBy, pipe, mapValues, map, isEmpty } from 'lodash/fp';
import createQueryBuilder from '../query/query-builder.mjs';

/* eslint-disable @typescript-eslint/naming-convention */ // allow __type
const getMorphToManyRowsLinkedToMorphOne = (rows, { uid, attributeName, typeColumn, db })=>rows.filter((row)=>{
        const relatedType = row[typeColumn.name];
        const field = row.field;
        const targetAttribute = db.metadata.get(relatedType).attributes[field];
        // ensure targeted field is the right one + check if it is a morphOne
        return targetAttribute?.target === uid && targetAttribute?.morphBy === attributeName && targetAttribute?.relation === 'morphOne';
    });
const deleteRelatedMorphOneRelationsAfterMorphToManyUpdate = async (rows, { uid, attributeName, joinTable, db, transaction: trx })=>{
    const { morphColumn } = joinTable;
    const { idColumn, typeColumn } = morphColumn;
    const morphOneRows = getMorphToManyRowsLinkedToMorphOne(rows, {
        uid,
        attributeName,
        typeColumn,
        db
    });
    const groupByType = groupBy(typeColumn.name);
    const groupByField = groupBy('field');
    const typeAndFieldIdsGrouped = pipe(groupByType, mapValues(groupByField))(morphOneRows);
    const orWhere = [];
    for (const [type, v] of Object.entries(typeAndFieldIdsGrouped)){
        for (const [field, arr] of Object.entries(v)){
            orWhere.push({
                [typeColumn.name]: type,
                field,
                [idColumn.name]: {
                    $in: map(idColumn.name, arr)
                }
            });
        }
    }
    if (!isEmpty(orWhere)) {
        await createQueryBuilder(joinTable.name, db).delete().where({
            $or: orWhere
        }).transacting(trx).execute();
    }
};
/**
 * Encoding utilities for polymorphic relations.
 *
 * In some scenarios is useful to encode both the id & __type of the relation
 * to have a unique identifier for the relation. (e.g. relations reordering)
 */ const encodePolymorphicId = (id, __type)=>{
    return `${id}:::${__type}`;
};
const encodePolymorphicRelation = curry(({ idColumn, typeColumn }, relation)=>{
    // Encode the id of the relation and the positional argument if it exist
    const newRelation = {
        ...relation,
        [idColumn]: encodePolymorphicId(relation[idColumn], relation[typeColumn])
    };
    if (relation.position) {
        const { before, after } = relation.position;
        const __type = relation.position.__type || relation.__type;
        newRelation.position = {
            ...relation.position
        };
        if (before) newRelation.position.before = encodePolymorphicId(before, __type);
        if (after) newRelation.position.after = encodePolymorphicId(after, __type);
    }
    return newRelation;
});

export { deleteRelatedMorphOneRelationsAfterMorphToManyUpdate, encodePolymorphicId, encodePolymorphicRelation };
//# sourceMappingURL=morph-relations.mjs.map
