import { getFolderURL } from './getFolderURL.mjs';
import { getTrad } from './getTrad.mjs';

const getBreadcrumbDataML = (folder, { pathname, query })=>{
    const data = [
        {
            id: null,
            label: {
                id: getTrad('plugin.name'),
                defaultMessage: 'Media Library'
            },
            href: folder ? getFolderURL(pathname, query || {}) : undefined
        }
    ];
    if (folder?.parent && typeof folder?.parent !== 'number' && folder?.parent?.parent) {
        data.push([]);
    }
    if (folder?.parent && typeof folder.parent !== 'number') {
        data.push({
            id: folder.parent.id,
            label: folder.parent.name,
            href: getFolderURL(pathname, query || {}, {
                folder: folder.parent.id?.toString(),
                folderPath: folder.parent.path
            })
        });
    }
    if (folder) {
        data.push({
            id: folder.id,
            label: folder.name
        });
    }
    return data;
};

export { getBreadcrumbDataML };
//# sourceMappingURL=getBreadcrumbDataML.mjs.map
