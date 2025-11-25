import type { UID, Struct, Core } from '@strapi/types';
import type { Configuration } from '../../../shared/contracts/content-types';
import type { ConfigurationUpdate } from './configuration';
declare const _default: ({ strapi }: {
    strapi: Core.Strapi;
}) => {
    findAllComponents(): unknown[];
    findComponent(uid: UID.Component): any;
    findConfiguration(component: Struct.ComponentSchema): Promise<{
        uid: string;
        settings: import("../../../shared/contracts/content-types").Settings;
        metadatas: import("../../../shared/contracts/content-types").Metadatas;
        layouts: import("../../../shared/contracts/content-types").Layouts;
        options?: object | undefined;
        category: string;
    }>;
    updateConfiguration(component: Struct.ComponentSchema, newConfiguration: ConfigurationUpdate): Promise<{
        uid: string;
        settings: import("../../../shared/contracts/content-types").Settings;
        metadatas: import("../../../shared/contracts/content-types").Metadatas;
        layouts: import("../../../shared/contracts/content-types").Layouts;
        options?: object | undefined;
        category: string;
    }>;
    findComponentsConfigurations(model: Struct.ComponentSchema): Promise<Record<string, Configuration & {
        category: string;
        isComponent: boolean;
    }>>;
    syncConfigurations(): Promise<void>;
};
export default _default;
//# sourceMappingURL=components.d.ts.map