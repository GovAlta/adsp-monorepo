declare const _default: {
    permission: {
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
                action: {
                    type: string;
                    minLength: number;
                    configurable: boolean;
                    required: boolean;
                };
                actionParameters: {
                    type: string;
                    configurable: boolean;
                    required: boolean;
                    default: {};
                };
                subject: {
                    type: string;
                    minLength: number;
                    configurable: boolean;
                    required: boolean;
                };
                properties: {
                    type: string;
                    configurable: boolean;
                    required: boolean;
                    default: {};
                };
                conditions: {
                    type: string;
                    configurable: boolean;
                    required: boolean;
                    default: never[];
                };
                role: {
                    configurable: boolean;
                    type: string;
                    relation: string;
                    inversedBy: string;
                    target: string;
                };
            };
        };
    };
    user: {
        schema: {
            collectionName: string;
            info: {
                name: string;
                description: string;
                singularName: string;
                pluralName: string;
                displayName: string;
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
                firstname: {
                    type: string;
                    unique: boolean;
                    minLength: number;
                    configurable: boolean;
                    required: boolean;
                };
                lastname: {
                    type: string;
                    unique: boolean;
                    minLength: number;
                    configurable: boolean;
                    required: boolean;
                };
                username: {
                    type: string;
                    unique: boolean;
                    configurable: boolean;
                    required: boolean;
                };
                email: {
                    type: string;
                    minLength: number;
                    configurable: boolean;
                    required: boolean;
                    unique: boolean;
                    private: boolean;
                };
                password: {
                    type: string;
                    minLength: number;
                    configurable: boolean;
                    required: boolean;
                    private: boolean;
                    searchable: boolean;
                };
                resetPasswordToken: {
                    type: string;
                    configurable: boolean;
                    private: boolean;
                    searchable: boolean;
                };
                registrationToken: {
                    type: string;
                    configurable: boolean;
                    private: boolean;
                    searchable: boolean;
                };
                isActive: {
                    type: string;
                    default: boolean;
                    configurable: boolean;
                    private: boolean;
                };
                roles: {
                    configurable: boolean;
                    private: boolean;
                    type: string;
                    relation: string;
                    inversedBy: string;
                    target: string;
                    collectionName: string;
                };
                blocked: {
                    type: string;
                    default: boolean;
                    configurable: boolean;
                    private: boolean;
                };
                preferedLanguage: {
                    type: string;
                    configurable: boolean;
                    required: boolean;
                    searchable: boolean;
                };
            };
            config: {
                attributes: {
                    resetPasswordToken: {
                        hidden: boolean;
                    };
                    registrationToken: {
                        hidden: boolean;
                    };
                };
            };
        };
    };
    role: {
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
                    minLength: number;
                    unique: boolean;
                    configurable: boolean;
                    required: boolean;
                };
                code: {
                    type: string;
                    minLength: number;
                    unique: boolean;
                    configurable: boolean;
                    required: boolean;
                };
                description: {
                    type: string;
                    configurable: boolean;
                };
                users: {
                    configurable: boolean;
                    type: string;
                    relation: string;
                    mappedBy: string;
                    target: string;
                };
                permissions: {
                    configurable: boolean;
                    type: string;
                    relation: string;
                    mappedBy: string;
                    target: string;
                };
            };
        };
    };
    'api-token': {
        schema: {
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
                type: {
                    type: string;
                    enum: string[];
                    configurable: boolean;
                    required: boolean;
                    default: string;
                };
                accessKey: {
                    type: string;
                    minLength: number;
                    configurable: boolean;
                    required: boolean;
                    searchable: boolean;
                };
                encryptedKey: {
                    type: string;
                    minLength: number;
                    configurable: boolean;
                    required: boolean;
                    searchable: boolean;
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
    };
    'api-token-permission': {
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
    };
    'transfer-token': {
        schema: {
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
    };
    'transfer-token-permission': {
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
    };
    session: {
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
    };
};
export default _default;
//# sourceMappingURL=index.d.ts.map