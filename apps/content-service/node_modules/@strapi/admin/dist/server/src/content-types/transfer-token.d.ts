declare const _default: {
    collectionName: string;
    info: {
        name: string;
        singularName: string;
        pluralName: string;
        displayName: string;
        description: string;
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
            minLength: number;
            configurable: boolean;
            required: boolean;
            unique: boolean;
        };
        description: {
            type: string;
            minLength: number;
            configurable: boolean;
            required: boolean;
            default: string;
        };
        accessKey: {
            type: string;
            minLength: number;
            configurable: boolean;
            required: boolean;
        };
        lastUsedAt: {
            type: string;
            configurable: boolean;
            required: boolean;
        };
        permissions: {
            type: string;
            target: string;
            relation: string;
            mappedBy: string;
            configurable: boolean;
            required: boolean;
        };
        expiresAt: {
            type: string;
            configurable: boolean;
            required: boolean;
        };
        lifespan: {
            type: string;
            configurable: boolean;
            required: boolean;
        };
    };
};
export default _default;
//# sourceMappingURL=transfer-token.d.ts.map