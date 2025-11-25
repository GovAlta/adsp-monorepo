import { curry, assoc } from 'lodash/fp';

const transformParamsToQuery = curry((uid, params)=>{
    const query = strapi.get('query-params').transform(uid, params);
    return assoc('where', {
        ...params?.lookup,
        ...query.where
    }, query);
});

export { transformParamsToQuery };
//# sourceMappingURL=query.mjs.map
