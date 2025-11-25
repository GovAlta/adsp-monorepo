'use strict';

var fp = require('lodash/fp');
var index = require('../../../utils/index.js');

const folderExists = async (folderId)=>{
    if (fp.isNil(folderId)) {
        return true;
    }
    const exists = await index.getService('folder').exists({
        id: folderId
    });
    return exists;
};

exports.folderExists = folderExists;
//# sourceMappingURL=utils.js.map
