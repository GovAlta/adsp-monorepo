import { isNil, isPlainObject } from 'lodash/fp';
import { async } from '@strapi/utils';

function isEntry(property) {
    return property === null || isPlainObject(property) || Array.isArray(property);
}
function isDZEntries(property) {
    return Array.isArray(property);
}
const transformResponse = async (resource, meta = {}, opts = {
    useJsonAPIFormat: false,
    encodeSourceMaps: false
})=>{
    if (isNil(resource)) {
        return resource;
    }
    if (!isPlainObject(resource) && !Array.isArray(resource)) {
        throw new Error('Entry must be an object or an array of objects');
    }
    // Transform pipeline functions
    const applyJsonApiFormat = async (data)=>opts.useJsonAPIFormat ? transformEntry(data, opts?.contentType) : data;
    const applySourceMapEncoding = async (data)=>opts.encodeSourceMaps && opts.contentType ? strapi.get('content-source-maps').encodeSourceMaps({
            data,
            schema: opts.contentType
        }) : data;
    // Process data through transformation pipeline
    const data = await async.pipe(applyJsonApiFormat, applySourceMapEncoding)(resource);
    return {
        data,
        meta
    };
};
function transformComponent(data, component) {
    if (Array.isArray(data)) {
        return data.map((datum)=>transformComponent(datum, component));
    }
    const res = transformEntry(data, component);
    if (isNil(res)) {
        return res;
    }
    const { id, attributes } = res;
    return {
        id,
        ...attributes
    };
}
function transformEntry(entry, type) {
    if (isNil(entry)) {
        return entry;
    }
    if (Array.isArray(entry)) {
        return entry.map((singleEntry)=>transformEntry(singleEntry, type));
    }
    if (!isPlainObject(entry)) {
        throw new Error('Entry must be an object');
    }
    const { id, documentId, ...properties } = entry;
    const attributeValues = {};
    for (const key of Object.keys(properties)){
        const property = properties[key];
        const attribute = type && type.attributes[key];
        if (attribute && attribute.type === 'relation' && isEntry(property) && 'target' in attribute) {
            const data = transformEntry(property, strapi.contentType(attribute.target));
            attributeValues[key] = {
                data
            };
        } else if (attribute && attribute.type === 'component' && isEntry(property)) {
            attributeValues[key] = transformComponent(property, strapi.components[attribute.component]);
        } else if (attribute && attribute.type === 'dynamiczone' && isDZEntries(property)) {
            if (isNil(property)) {
                attributeValues[key] = property;
            }
            attributeValues[key] = property.map((subProperty)=>{
                return transformComponent(subProperty, strapi.components[subProperty.__component]);
            });
        } else if (attribute && attribute.type === 'media' && isEntry(property)) {
            const data = transformEntry(property, strapi.contentType('plugin::upload.file'));
            attributeValues[key] = {
                data
            };
        } else {
            attributeValues[key] = property;
        }
    }
    return {
        id,
        documentId,
        attributes: attributeValues
    };
}

export { transformResponse };
//# sourceMappingURL=transform.mjs.map
