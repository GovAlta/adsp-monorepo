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
        options: {
            version: string;
        };
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
                configurable: boolean;
            };
            color: {
                type: string;
                configurable: boolean;
                default: string;
            };
            workflow: {
                type: string;
                target: string;
                relation: string;
                inversedBy: string;
                configurable: boolean;
            };
            permissions: {
                type: string;
                target: string;
                relation: string;
                configurable: boolean;
            };
        };
    };
};
export default _default;
//# sourceMappingURL=index.d.ts.map