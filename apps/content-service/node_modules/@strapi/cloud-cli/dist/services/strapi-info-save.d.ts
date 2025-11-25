import type { ProjectInfo } from './cli-api';
export declare const LOCAL_SAVE_FILENAME = ".strapi-cloud.json";
export type LocalSave = {
    project?: Omit<ProjectInfo, 'id'>;
};
type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
export type LocalPatch = {
    project?: DeepPartial<Omit<ProjectInfo, 'id'>>;
};
export declare function save(data: LocalSave, { directoryPath }?: {
    directoryPath?: string;
}): Promise<void>;
export declare function retrieve({ directoryPath, }?: {
    directoryPath?: string;
}): Promise<LocalSave>;
export declare function patch(patchData: LocalPatch, { directoryPath }?: {
    directoryPath?: string;
}): Promise<void>;
export declare function deleteConfig({ directoryPath }?: {
    directoryPath?: string;
}): Promise<void>;
export {};
//# sourceMappingURL=strapi-info-save.d.ts.map