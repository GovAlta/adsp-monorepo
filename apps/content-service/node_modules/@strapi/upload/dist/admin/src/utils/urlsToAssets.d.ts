import { AssetSource } from '../constants';
export declare const urlsToAssets: (urls: string[]) => Promise<{
    source: AssetSource;
    name: string;
    type: import("../constants").AssetType;
    url: string;
    ext: string | undefined;
    mime: string | undefined;
    rawFile: File;
}[]>;
