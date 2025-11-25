'use strict';

var fp = require('lodash/fp');

const transformParamsToQuery = fp.curry((uid, params)=>{
    const query = strapi.get('query-params').transform(uid, params);
    return fp.assoc('where', {
        ...params?.lookup,
        ...query.where
    }, query);
});

exports.transformParamsToQuery = transformParamsToQuery;
//# sourceMappingURL=query.js.map
