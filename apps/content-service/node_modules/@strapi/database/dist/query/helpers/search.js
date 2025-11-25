'use strict';

var _ = require('lodash/fp');
var types = require('../../utils/types.js');
var transform = require('./transform.js');

const applySearch = (knex, query, ctx)=>{
    const { qb, uid, db } = ctx;
    const meta = db.metadata.get(uid);
    const { attributes } = meta;
    const searchColumns = [
        'id'
    ];
    const stringColumns = Object.keys(attributes).filter((attributeName)=>{
        const attribute = attributes[attributeName];
        return types.isScalarAttribute(attribute) && types.isString(attribute.type) && attribute.searchable !== false;
    });
    searchColumns.push(...stringColumns);
    if (!_.isNaN(_.toNumber(query))) {
        const numberColumns = Object.keys(attributes).filter((attributeName)=>{
            const attribute = attributes[attributeName];
            return types.isScalarAttribute(attribute) && types.isNumber(attribute.type) && attribute.searchable !== false;
        });
        searchColumns.push(...numberColumns);
    }
    switch(db.dialect.client){
        case 'postgres':
            {
                searchColumns.forEach((attr)=>{
                    const columnName = transform.toColumnName(meta, attr);
                    return knex.orWhereRaw(`??::text ILIKE ?`, [
                        qb.aliasColumn(columnName),
                        `%${escapeQuery(query, '*%\\')}%`
                    ]);
                });
                break;
            }
        case 'sqlite':
            {
                searchColumns.forEach((attr)=>{
                    const columnName = transform.toColumnName(meta, attr);
                    return knex.orWhereRaw(`?? LIKE ? ESCAPE '\\'`, [
                        qb.aliasColumn(columnName),
                        `%${escapeQuery(query, '*%\\')}%`
                    ]);
                });
                break;
            }
        case 'mysql':
            {
                searchColumns.forEach((attr)=>{
                    const columnName = transform.toColumnName(meta, attr);
                    return knex.orWhereRaw(`?? LIKE ?`, [
                        qb.aliasColumn(columnName),
                        `%${escapeQuery(query, '*%\\')}%`
                    ]);
                });
                break;
            }
    }
};
const escapeQuery = (query, charsToEscape, escapeChar = '\\')=>{
    return query.split('').reduce((escapedQuery, char)=>charsToEscape.includes(char) ? `${escapedQuery}${escapeChar}${char}` : `${escapedQuery}${char}`, '');
};

exports.applySearch = applySearch;
//# sourceMappingURL=search.js.map
