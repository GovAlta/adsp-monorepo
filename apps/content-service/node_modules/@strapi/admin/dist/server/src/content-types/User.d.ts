declare const _default: {
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
export default _default;
//# sourceMappingURL=User.d.ts.map