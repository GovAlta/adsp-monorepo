import { isMorphToRelationalAttribute } from '../../content-types.mjs';

const visitor = ({ key, attribute }, { remove })=>{
    if (isMorphToRelationalAttribute(attribute)) {
        remove(key);
    }
};

export { visitor as default };
//# sourceMappingURL=remove-morph-to-relations.mjs.map
