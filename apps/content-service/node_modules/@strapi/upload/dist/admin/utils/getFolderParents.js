'use strict';

var flattenTree = require('../components/SelectTree/utils/flattenTree.js');

const getFolderParents = (folders, currentFolderId)=>{
    const parents = [];
    const flatFolders = flattenTree.flattenTree(folders);
    const currentFolder = flatFolders.find((folder)=>folder.value === currentFolderId);
    if (!currentFolder) {
        return [];
    }
    let { parent } = currentFolder;
    while(parent !== undefined){
        // eslint-disable-next-line no-loop-func
        const parentToStore = flatFolders.find(({ value })=>value === parent);
        parents.push({
            id: parentToStore?.value,
            label: parentToStore?.label
        });
        parent = parentToStore?.parent;
    }
    return parents.reverse();
};

exports.getFolderParents = getFolderParents;
//# sourceMappingURL=getFolderParents.js.map
