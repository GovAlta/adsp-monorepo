'use strict';

var fp = require('lodash/fp');
var data = require('./data.js');
var fields = require('./fields.js');
var populate = require('./populate.js');

/**
 * Transform input of a query to map document ids to entity ids.
 */ async function transformParamsDocumentId(uid, query) {
    // Transform relational documentIds to entity ids
    let data$1 = query.data;
    if (query.data) {
        data$1 = await data.transformData(query.data, {
            locale: query.locale,
            status: query.status,
            uid
        });
    }
    // Make sure documentId is always present in the response
    let fields$1 = query.fields;
    if (query.fields) {
        fields$1 = fields.transformFields(query.fields);
    }
    let populate$1 = query.populate;
    if (query.populate) {
        populate$1 = await populate.transformPopulate(query.populate, {
            uid
        });
    }
    return {
        ...query,
        data: data$1,
        fields: fields$1,
        populate: populate$1
    };
}
const curriedTransformParamsDocumentId = fp.curry(transformParamsDocumentId);

exports.transformParamsDocumentId = curriedTransformParamsDocumentId;
//# sourceMappingURL=id-transform.js.map
