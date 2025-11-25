import { isPrivateAttribute } from '../../content-types.mjs';

const visitor = ({ schema, key, attribute }, { remove })=>{
    if (!attribute) {
        return;
    }
    const isPrivate = attribute.private === true || isPrivateAttribute(schema, key);
    if (isPrivate) {
        remove(key);
    }
};

export { visitor as default };
//# sourceMappingURL=remove-private.mjs.map
