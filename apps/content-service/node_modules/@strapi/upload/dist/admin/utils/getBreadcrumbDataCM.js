'use strict';

var getTrad = require('./getTrad.js');

const getBreadcrumbDataCM = (folder)=>{
    const data = [
        {
            id: null,
            label: {
                id: getTrad.getTrad('plugin.name'),
                defaultMessage: 'Media Library'
            }
        }
    ];
    if (folder?.parent?.parent) {
        data.push([]);
    }
    if (folder?.parent) {
        data.push({
            id: folder.parent.id,
            label: folder.parent.name,
            path: folder.parent.path
        });
    }
    if (folder) {
        data.push({
            id: folder.id,
            label: folder.name,
            path: folder.path
        });
    }
    return data;
};

exports.getBreadcrumbDataCM = getBreadcrumbDataCM;
//# sourceMappingURL=getBreadcrumbDataCM.js.map
