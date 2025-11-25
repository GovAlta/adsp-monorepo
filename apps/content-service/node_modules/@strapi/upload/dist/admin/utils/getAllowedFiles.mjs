import { toSingularTypes } from './toSingularTypes.mjs';

const getAllowedFiles = (pluralTypes, files)=>{
    if (!pluralTypes) {
        return files;
    }
    const singularTypes = toSingularTypes(pluralTypes);
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

export { getAllowedFiles };
//# sourceMappingURL=getAllowedFiles.mjs.map
