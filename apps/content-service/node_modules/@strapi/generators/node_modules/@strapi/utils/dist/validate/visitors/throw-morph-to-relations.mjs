import { isMorphToRelationalAttribute } from '../../content-types.mjs';
import { throwInvalidKey } from '../utils.mjs';

const visitor = ({ key, attribute, path })=>{
    if (isMorphToRelationalAttribute(attribute)) {
        throwInvalidKey({
            key,
            path: path.attribute
        });
    }
};

export { visitor as default };
//# sourceMappingURL=throw-morph-to-relations.mjs.map
