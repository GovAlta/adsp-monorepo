declare const _default: {
    collectionName: string;
    info: {
        name: string;
        description: string;
        singularName: string;
        pluralName: string;
        displayName: string;
    };
    options: {
        draftAndPublish: boolean;
    };
    pluginOptions: {
        'content-manager': {
            visible: boolean;
        };
        'content-type-builder': {
            visible: boolean;
        };
        i18n: {
            localized: boolean;
        };
    };
    attributes: {
        userId: {
            type: string;
            required: boolean;
            configurable: boolean;
            private: boolean;
            searchable: boolean;
        };
        sessionId: {
            type: string;
            unique: boolean;
            required: boolean;
            configurable: boolean;
            private: boolean;
            searchable: boolean;
        };
        childId: {
            type: string;
            configurable: boolean;
            private: boolean;
            searchable: boolean;
        };
        deviceId: {
            type: string;
            required: boolean;
            configurable: boolean;
            private: boolean;
            searchable: boolean;
        };
        origin: {
            type: string;
            required: boolean;
            configurable: boolean;
            private: boolean;
            searchable: boolean;
        };
        expiresAt: {
            type: string;
            required: boolean;
            configurable: boolean;
            private: boolean;
            searchable: boolean;
        };
        absoluteExpiresAt: {
            type: string;
            configurable: boolean;
            private: boolean;
            searchable: boolean;
        };
        status: {
            type: string;
            configurable: boolean;
            private: boolean;
            searchable: boolean;
        };
        type: {
            type: string;
            configurable: boolean;
            private: boolean;
            searchable: boolean;
        };
    };
};
export default _default;
//# sourceMappingURL=session.d.ts.map