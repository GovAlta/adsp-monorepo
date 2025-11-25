declare const permissions: () => {
    actions: {
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
    sectionsBuilder: {
        localesPropertyHandler: ({ action, section }: any) => Promise<void>;
        registerLocalesPropertyHandler: () => void;
    };
    engine: {
        willRegisterPermission: (context: any) => void;
        registerI18nPermissionsHandlers: () => void;
    };
};
type PermissionsService = typeof permissions;
export default permissions;
export type { PermissionsService };
//# sourceMappingURL=permissions.d.ts.map