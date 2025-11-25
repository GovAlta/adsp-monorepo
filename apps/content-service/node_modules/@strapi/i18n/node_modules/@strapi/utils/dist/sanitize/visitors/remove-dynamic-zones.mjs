import { isDynamicZoneAttribute } from '../../content-types.mjs';

const visitor = ({ key, attribute }, { remove })=>{
    if (isDynamicZoneAttribute(attribute)) {
        remove(key);
    }
};

export { visitor as default };
//# sourceMappingURL=remove-dynamic-zones.mjs.map
