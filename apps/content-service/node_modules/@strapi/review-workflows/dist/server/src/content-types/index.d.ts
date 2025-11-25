declare const _default: {
    workflow: {
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
    'workflow-stage': {
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
};
export default _default;
//# sourceMappingURL=index.d.ts.map