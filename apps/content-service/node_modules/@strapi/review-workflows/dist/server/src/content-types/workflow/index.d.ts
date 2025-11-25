declare const _default: {
    schema: {
        collectionName: string;
        info: {
            name: string;
            description: string;
            singularName: string;
            pluralName: string;
            displayName: string;
        };
        options: {};
        pluginOptions: {
            'content-manager': {
                visible: boolean;
            };
            'content-type-builder': {
                visible: boolean;
            };
        };
        attributes: {
            name: {
                type: string;
                required: boolean;
                unique: boolean;
            };
            stages: {
                type: string;
                target: string;
                relation: string;
                mappedBy: string;
            };
            stageRequiredToPublish: {
                type: string;
                target: string;
                relation: string;
                required: boolean;
            };
            contentTypes: {
                type: string;
                required: boolean;
                default: string;
            };
        };
    };
};
export default _default;
//# sourceMappingURL=index.d.ts.map