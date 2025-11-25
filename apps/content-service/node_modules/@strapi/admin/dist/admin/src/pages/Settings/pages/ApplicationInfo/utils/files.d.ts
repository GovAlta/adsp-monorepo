import type { MessageDescriptor } from 'react-intl';
interface ImageDimensions {
    height: number;
    width: number;
}
interface ImageAsset extends ImageDimensions {
    ext: string | undefined;
    size: number;
    name: string;
    url: string;
    rawFile: File;
}
declare const parseFileMetadatas: (file: File) => Promise<ImageAsset>;
declare class ParsingFileError extends Error {
    displayMessage: MessageDescriptor;
    constructor(message: string, displayMessage: MessageDescriptor, options?: ErrorOptions);
}
export { parseFileMetadatas, ParsingFileError };
export type { ImageAsset };
