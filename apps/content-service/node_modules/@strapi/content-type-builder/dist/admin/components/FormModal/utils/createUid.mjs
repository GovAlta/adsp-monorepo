import { nameToSlug } from '../../../utils/nameToSlug.mjs';

const createUid = (name)=>{
    const modelName = nameToSlug(name);
    return `api::${modelName}.${modelName}`;
};
// From `content-type-builder/services/Components/createComponentUid`
const createComponentUid = (name, category)=>{
    return `${nameToSlug(category)}.${nameToSlug(name)}`;
};

export { createComponentUid, createUid };
//# sourceMappingURL=createUid.mjs.map
