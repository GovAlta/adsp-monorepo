import { pipe, map, flatMap, values, sumBy } from 'lodash/fp';

const getNumberOfDynamicZones = ()=>{
    const contentTypes = strapi.contentTypes;
    return pipe(map('attributes'), flatMap(values), sumBy((item)=>{
        if (item.type === 'dynamiczone') {
            return 1;
        }
        return 0;
    }))(contentTypes);
};

export { getNumberOfDynamicZones as default };
//# sourceMappingURL=dynamic-zones.mjs.map
