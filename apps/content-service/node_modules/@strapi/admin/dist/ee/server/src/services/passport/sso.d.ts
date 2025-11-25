import '@strapi/types';
export declare const providerRegistry: Map<any, any>;
export declare const getStrategyCallbackURL: (providerName: string) => string;
export declare const syncProviderRegistryWithConfig: () => void;
export declare const SSOAuthEventsMapper: {
    onSSOAutoRegistration: string;
};
declare const _default: {
    providerRegistry: Map<any, any>;
    getStrategyCallbackURL: (providerName: string) => string;
    syncProviderRegistryWithConfig: () => void;
    authEventsMapper: {
        onSSOAutoRegistration: string;
        onConnectionSuccess: string;
        onConnectionError: string;
    };
};
export default _default;
//# sourceMappingURL=sso.d.ts.map