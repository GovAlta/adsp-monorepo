declare const _default: {
    auth: {
        forgotPassword: ({ email }?: any) => Promise<any>;
        resetPassword: ({ resetPasswordToken, password }?: any) => Promise<any>;
    };
    passport: {
        providerRegistry: Map<any, any>;
        getStrategyCallbackURL: (providerName: string) => string;
        syncProviderRegistryWithConfig: () => void;
        authEventsMapper: {
            onSSOAutoRegistration: string;
            onConnectionSuccess: string;
            onConnectionError: string;
        };
        getPassportStrategies: () => any[];
    };
    role: {
        ssoCheckRolesIdForDeletion: (ids: any) => Promise<void>;
    };
    user: {
        updateEEDisabledUsersList: (id: string, input: any) => Promise<void>;
        removeFromEEDisabledUsersList: (ids: unknown) => Promise<void>;
        getCurrentActiveUserCount: () => Promise<number>;
        deleteByIds: (ids: any) => Promise<any[]>;
        deleteById: (id: unknown) => Promise<any>;
        updateById: (id: any, attributes: any) => Promise<any>;
    };
    metrics: {
        startCron: (strapi: import("@strapi/types/dist/core").Strapi) => void;
        getSSOProvidersList: () => Promise<any>;
        sendUpdateProjectInformation: (strapi: import("@strapi/types/dist/core").Strapi) => Promise<void>;
    };
    'seat-enforcement': {
        seatEnforcementWorkflow: () => Promise<void>;
        getDisabledUserList: () => Promise<unknown>;
    };
    'persist-tables': {
        persistTablesWithPrefix: (tableNamePrefix: string) => Promise<void>;
        removePersistedTablesWithSuffix: (tableNameSuffix: string) => Promise<void>;
        persistTables: (tables: (string | import("./persist-tables").PersistedTable)[]) => Promise<void>;
        findTables: typeof import("./persist-tables").findTables;
    };
};
export default _default;
//# sourceMappingURL=index.d.ts.map