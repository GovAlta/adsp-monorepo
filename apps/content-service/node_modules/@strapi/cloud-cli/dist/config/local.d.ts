export declare const CONFIG_FILENAME = "config.json";
export type LocalConfig = {
    token?: string;
    installId?: string;
};
export declare function getTmpStoragePath(): Promise<string>;
export declare function getLocalConfig(): Promise<LocalConfig>;
export declare function saveLocalConfig(data: LocalConfig): Promise<void>;
//# sourceMappingURL=local.d.ts.map