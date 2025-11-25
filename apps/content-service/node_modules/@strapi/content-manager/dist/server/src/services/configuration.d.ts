import type { Settings, Metadatas, Layouts } from '../../../shared/contracts/content-types';
export type ConfigurationUpdate = {
    settings: Settings;
    metadatas: Metadatas;
    layouts: Layouts;
    options?: Record<string, unknown>;
};
declare const _default: ({ isComponent, prefix, storeUtils, getModels, }: {
    isComponent?: boolean;
    prefix: string;
    storeUtils: any;
    getModels: any;
}) => {
    getConfiguration: (uid: string) => any;
    setConfiguration: (uid: string, input: ConfigurationUpdate) => any;
    deleteConfiguration: (uid: string) => any;
    syncConfigurations: () => Promise<void>;
};
export default _default;
//# sourceMappingURL=configuration.d.ts.map