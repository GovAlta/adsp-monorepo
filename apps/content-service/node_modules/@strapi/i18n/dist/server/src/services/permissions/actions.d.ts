declare const _default: {
    actions: ({
        section: string;
        category: string;
        subCategory: string;
        pluginName: string;
        displayName: string;
        uid: string;
        aliases?: undefined;
    } | {
        section: string;
        category: string;
        subCategory: string;
        pluginName: string;
        displayName: string;
        uid: string;
        aliases: {
            actionId: string;
            subjects: string[];
        }[];
    })[];
    registerI18nActions: () => Promise<void>;
    registerI18nActionsHooks: () => void;
    updateActionsProperties: () => void;
    syncSuperAdminPermissionsWithLocales: () => Promise<void>;
};
export default _default;
//# sourceMappingURL=actions.d.ts.map