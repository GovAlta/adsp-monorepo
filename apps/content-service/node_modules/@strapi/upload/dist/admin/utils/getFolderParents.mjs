import { flattenTree } from '../components/SelectTree/utils/flattenTree.mjs';

const getFolderParents = (folders, currentFolderId)=>{
    const parents = [];
    const flatFolders = flattenTree(folders);
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

export { getFolderParents };
//# sourceMappingURL=getFolderParents.mjs.map
