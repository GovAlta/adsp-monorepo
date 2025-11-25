import { isNil } from 'lodash/fp';
import { getService } from '../../../utils/index.mjs';

const folderExists = async (folderId)=>{
    if (isNil(folderId)) {
        return true;
    }
    const exists = await getService('folder').exists({
        id: folderId
    });
    return exists;
};

export { folderExists };
//# sourceMappingURL=utils.mjs.map
