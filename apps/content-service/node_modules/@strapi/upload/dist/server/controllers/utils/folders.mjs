const isFolderOrChild = (folderOrChild, folder)=>folderOrChild.path === folder.path || folderOrChild.path.startsWith(`${folder.path}/`);

export { isFolderOrChild };
//# sourceMappingURL=folders.mjs.map
