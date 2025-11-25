'use strict';

var toSingularTypes = require('./toSingularTypes.js');

const getAllowedFiles = (pluralTypes, files)=>{
    if (!pluralTypes) {
        return files;
    }
    const singularTypes = toSingularTypes.toSingularTypes(pluralTypes);
    const allowedFiles = files.filter((file)=>{
        const fileType = file?.mime?.split('/')[0];
        if (!fileType) {
            return false;
        }
        if (singularTypes.includes('file') && ![
            'video',
            'image',
            'audio'
        ].includes(fileType)) {
            return true;
        }
        return singularTypes.includes(fileType);
    });
    return allowedFiles;
};

exports.getAllowedFiles = getAllowedFiles;
//# sourceMappingURL=getAllowedFiles.js.map
