'use strict';

const isFolderOrChild = (folderOrChild, folder)=>folderOrChild.path === folder.path || folderOrChild.path.startsWith(`${folder.path}/`);

exports.isFolderOrChild = isFolderOrChild;
//# sourceMappingURL=folders.js.map
