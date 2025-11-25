import { isDynamicZoneAttribute } from '../../content-types.mjs';
import { throwInvalidKey } from '../utils.mjs';

const visitor = ({ key, attribute, path })=>{
    if (isDynamicZoneAttribute(attribute)) {
        throwInvalidKey({
            key,
            path: path.attribute
        });
    }
};

export { visitor as default };
//# sourceMappingURL=throw-dynamic-zones.mjs.map
