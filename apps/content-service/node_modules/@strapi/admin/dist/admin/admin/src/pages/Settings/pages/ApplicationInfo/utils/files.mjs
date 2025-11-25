import { ACCEPTED_FORMAT, DIMENSION, SIZE } from './constants.mjs';

const FILE_FORMAT_ERROR_MESSAGE = {
    id: 'Settings.application.customization.modal.upload.error-format',
    defaultMessage: 'Wrong format uploaded (accepted formats only: jpeg, jpg, png, svg).'
};
const FILE_SIZING_ERROR_MESSAGE = {
    id: 'Settings.application.customization.modal.upload.error-size',
    defaultMessage: 'The file uploaded is too large (max dimension: {dimension}x{dimension}, max file size: {size}KB)'
};
const parseFileMetadatas = async (file)=>{
    const isFormatAuthorized = ACCEPTED_FORMAT.includes(file.type);
    if (!isFormatAuthorized) {
        throw new ParsingFileError('File format', FILE_FORMAT_ERROR_MESSAGE);
    }
    const fileDimensions = await new Promise((resolve)=>{
        const reader = new FileReader();
        reader.onload = ()=>{
            const img = new Image();
            img.onload = ()=>{
                resolve({
                    width: img.width,
                    height: img.height
                });
            };
            img.src = reader.result;
        };
        reader.readAsDataURL(file);
    });
    const areDimensionsAuthorized = fileDimensions.width <= DIMENSION && fileDimensions.height <= DIMENSION;
    if (!areDimensionsAuthorized) {
        throw new ParsingFileError('File sizing', FILE_SIZING_ERROR_MESSAGE);
    }
    const asset = {
        ext: file.name.split('.').pop(),
        size: file.size / 1000,
        name: file.name,
        url: URL.createObjectURL(file),
        rawFile: file,
        width: fileDimensions.width,
        height: fileDimensions.height
    };
    const isSizeAuthorized = asset.size <= SIZE;
    if (!isSizeAuthorized) {
        throw new ParsingFileError('File sizing', FILE_SIZING_ERROR_MESSAGE);
    }
    return asset;
};
class ParsingFileError extends Error {
    constructor(message, displayMessage, options){
        super(message, options);
        this.displayMessage = displayMessage;
    }
}

export { ParsingFileError, parseFileMetadatas };
//# sourceMappingURL=files.mjs.map
