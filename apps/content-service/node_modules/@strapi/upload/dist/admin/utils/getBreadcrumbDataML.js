'use strict';

var getFolderURL = require('./getFolderURL.js');
var getTrad = require('./getTrad.js');

const getBreadcrumbDataML = (folder, { pathname, query })=>{
    const data = [
        {
            id: null,
            label: {
                id: getTrad.getTrad('plugin.name'),
                defaultMessage: 'Media Library'
            },
            href: folder ? getFolderURL.getFolderURL(pathname, query || {}) : undefined
        }
    ];
    if (folder?.parent && typeof folder?.parent !== 'number' && folder?.parent?.parent) {
        data.push([]);
    }
    if (folder?.parent && typeof folder.parent !== 'number') {
        data.push({
            id: folder.parent.id,
            label: folder.parent.name,
            href: getFolderURL.getFolderURL(pathname, query || {}, {
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

exports.getBreadcrumbDataML = getBreadcrumbDataML;
//# sourceMappingURL=getBreadcrumbDataML.js.map
