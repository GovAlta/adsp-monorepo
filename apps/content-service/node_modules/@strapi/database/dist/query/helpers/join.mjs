const createPivotJoin = (ctx, { alias, refAlias, joinTable, targetMeta })=>{
    const { qb } = ctx;
    const joinAlias = qb.getAlias();
    qb.join({
        alias: joinAlias,
        referencedTable: joinTable.name,
        referencedColumn: joinTable.joinColumn.name,
        rootColumn: joinTable.joinColumn.referencedColumn,
        rootTable: alias,
        on: joinTable.on
    });
    const subAlias = refAlias || qb.getAlias();
    qb.join({
        alias: subAlias,
        referencedTable: targetMeta.tableName,
        referencedColumn: joinTable.inverseJoinColumn.referencedColumn,
        rootColumn: joinTable.inverseJoinColumn.name,
        rootTable: joinAlias
    });
    return subAlias;
};
const createJoin = (ctx, { alias, refAlias, attributeName, attribute })=>{
    const { db, qb, uid } = ctx;
    if (attribute.type !== 'relation') {
        throw new Error(`Cannot join on non relational field ${attributeName}`);
    }
    const targetMeta = db.metadata.get(attribute.target);
    if ([
        'morphOne',
        'morphMany'
    ].includes(attribute.relation)) {
        const targetAttribute = targetMeta.attributes[attribute.morphBy];
        // @ts-expect-error - morphBy is not defined on the attribute
        const { joinTable, morphColumn } = targetAttribute;
        if (morphColumn) {
            const subAlias = refAlias || qb.getAlias();
            qb.join({
                alias: subAlias,
                referencedTable: targetMeta.tableName,
                referencedColumn: morphColumn.idColumn.name,
                rootColumn: morphColumn.idColumn.referencedColumn,
                rootTable: alias,
                on: {
                    [morphColumn.typeColumn.name]: uid,
                    ...morphColumn.on
                }
            });
            return subAlias;
        }
        if (joinTable) {
            const joinAlias = qb.getAlias();
            qb.join({
                alias: joinAlias,
                referencedTable: joinTable.name,
                referencedColumn: joinTable.morphColumn.idColumn.name,
                rootColumn: joinTable.morphColumn.idColumn.referencedColumn,
                rootTable: alias,
                on: {
                    [joinTable.morphColumn.typeColumn.name]: uid,
                    field: attributeName
                }
            });
            const subAlias = refAlias || qb.getAlias();
            qb.join({
                alias: subAlias,
                referencedTable: targetMeta.tableName,
                referencedColumn: joinTable.joinColumn.referencedColumn,
                rootColumn: joinTable.joinColumn.name,
                rootTable: joinAlias
            });
            return subAlias;
        }
        return alias;
    }
    const { joinColumn } = attribute;
    if (joinColumn) {
        const subAlias = refAlias || qb.getAlias();
        qb.join({
            alias: subAlias,
            referencedTable: targetMeta.tableName,
            referencedColumn: joinColumn.referencedColumn,
            rootColumn: joinColumn.name,
            rootTable: alias
        });
        return subAlias;
    }
    const { joinTable } = attribute;
    if (joinTable) {
        return createPivotJoin(ctx, {
            alias,
            refAlias,
            joinTable,
            targetMeta
        });
    }
    return alias;
};
// TODO: toColumnName for orderBy & on
const applyJoin = (qb, join)=>{
    const { method = 'leftJoin', alias, referencedTable, referencedColumn, rootColumn, // FIXME: qb.alias can't exist here
    rootTable, on, orderBy } = join;
    qb[method](`${referencedTable} as ${alias}`, (inner)=>{
        inner.on(`${rootTable}.${rootColumn}`, `${alias}.${referencedColumn}`);
        if (on) {
            for (const key of Object.keys(on)){
                inner.onVal(`${alias}.${key}`, on[key]);
            }
        }
    });
    if (orderBy) {
        Object.keys(orderBy).forEach((column)=>{
            const direction = orderBy[column];
            qb.orderBy(`${alias}.${column}`, direction);
        });
    }
};
const applyJoins = (qb, joins)=>{
    return joins.forEach((join)=>applyJoin(qb, join));
};

export { applyJoin, applyJoins, createJoin, createPivotJoin };
//# sourceMappingURL=join.mjs.map
