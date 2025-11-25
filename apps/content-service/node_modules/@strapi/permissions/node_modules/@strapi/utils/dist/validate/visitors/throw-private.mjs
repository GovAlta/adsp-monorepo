import { isPrivateAttribute } from '../../content-types.mjs';
import { throwInvalidKey } from '../utils.mjs';

const visitor = ({ schema, key, attribute, path })=>{
    if (!attribute) {
        return;
    }
    const isPrivate = attribute.private === true || isPrivateAttribute(schema, key);
    if (isPrivate) {
        throwInvalidKey({
            key,
            path: path.attribute
        });
    }
};

export { visitor as default };
//# sourceMappingURL=throw-private.mjs.map
