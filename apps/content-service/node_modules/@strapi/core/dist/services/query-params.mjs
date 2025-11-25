import { queryParams } from '@strapi/utils';

var createQueryParamService = ((strapi)=>{
    const { transformQueryParams } = queryParams.createTransformer({
        getModel: (uid)=>strapi.getModel(uid)
    });
    return {
        transform: transformQueryParams
    };
});

export { createQueryParamService as default };
//# sourceMappingURL=query-params.mjs.map
