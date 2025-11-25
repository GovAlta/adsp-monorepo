export declare const useCropImg: () => {
    width?: number | undefined;
    height?: number | undefined;
    crop: (image: HTMLImageElement) => void;
    produceFile: (name: string, mimeType: string, lastModifiedDate: string) => Promise<unknown>;
    stopCropping: () => void;
    isCropping: boolean;
    isCropperReady: boolean;
};
