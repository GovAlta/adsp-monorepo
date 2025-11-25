import type { Struct } from '@strapi/types';
declare const _default: () => {
    toContentManagerModel(contentType: Struct.ComponentSchema): {
        apiID: string;
        isDisplayed: boolean;
        attributes: any;
        modelType: "component";
        uid: `${string}.${string}`;
        category: string;
        modelName: string;
        globalId: string;
        pluginOptions?: Struct.SchemaPluginOptions | undefined;
        options?: Struct.SchemaOptions | undefined;
        collectionName?: string | undefined;
        plugin?: string | undefined;
        info: Struct.SchemaInfo;
    };
    toDto: import("lodash/fp").LodashPick2x1;
};
export default _default;
//# sourceMappingURL=data-mapper.d.ts.map