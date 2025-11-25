import { contentTypes } from '@strapi/utils';
import { createSingleTypeService } from './single-type.mjs';
import { createCollectionTypeService } from './collection-type.mjs';

const isSingleType = (contentType)=>contentTypes.isSingleType(contentType);
function createService({ contentType }) {
    if (isSingleType(contentType)) {
        return createSingleTypeService(contentType);
    }
    return createCollectionTypeService(contentType);
}

export { createService };
//# sourceMappingURL=index.mjs.map
