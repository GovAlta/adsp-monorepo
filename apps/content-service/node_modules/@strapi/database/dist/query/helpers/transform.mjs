import _ from 'lodash/fp';
import { isScalar, isRelation } from '../../utils/types.mjs';
import { createField } from '../../fields/index.mjs';

const fromSingleRow = (meta, row)=>{
    const { attributes } = meta;
    if (_.isNil(row)) {
        return null;
    }
    const obj = {};
    for(const column in row){
        if (!_.has(column, meta.columnToAttribute)) {
            continue;
        }
        const attributeName = meta.columnToAttribute[column];
        const attribute = attributes[attributeName];
        if (isScalar(attribute.type)) {
            const field = createField(attribute);
            const val = row[column] === null ? null : field.fromDB(row[column]);
            obj[attributeName] = val;
        }
        if (isRelation(attribute.type)) {
            obj[attributeName] = row[column];
        }
    }
    return obj;
};
const fromRow = (meta, row)=>{
    if (_.isNil(row)) {
        return null;
    }
    if (Array.isArray(row)) {
        return row.map((singleRow)=>fromSingleRow(meta, singleRow));
    }
    return fromSingleRow(meta, row);
};
const toSingleRow = (meta, data = {})=>{
    if (_.isNil(data)) {
        return data;
    }
    const { attributes } = meta;
    for (const key of Object.keys(data)){
        const attribute = attributes[key];
        if (!attribute || !('columnName' in attribute) || !attribute.columnName || attribute.columnName === key) {
            continue;
        }
        data[attribute.columnName] = data[key];
        delete data[key];
    }
    return data;
};
function toRow(meta, data) {
    if (_.isNil(data)) {
        return data;
    }
    if (_.isArray(data)) {
        return data.map((datum)=>toSingleRow(meta, datum));
    }
    return toSingleRow(meta, data);
}
const toColumnName = (meta, name)=>{
    if (!name) {
        throw new Error('Name cannot be null');
    }
    const attribute = meta.attributes[name];
    if (!attribute) {
        return name;
    }
    return 'columnName' in attribute && attribute.columnName || name;
};

export { fromRow, toColumnName, toRow };
//# sourceMappingURL=transform.mjs.map
