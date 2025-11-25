declare const _default: {
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
        action: {
            type: string;
            minLength: number;
            configurable: boolean;
            required: boolean;
        };
        token: {
            configurable: boolean;
            type: string;
            relation: string;
            inversedBy: string;
            target: string;
        };
    };
};
export default _default;
//# sourceMappingURL=transfer-token-permission.d.ts.map