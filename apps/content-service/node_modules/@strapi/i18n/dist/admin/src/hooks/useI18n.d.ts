type UseI18n = () => {
    hasI18n: boolean;
    canCreate: string[];
    canRead: string[];
    canUpdate: string[];
    canDelete: string[];
    canPublish: string[];
};
/**
 * @alpha
 * @description This hook is used to get the i18n status of a content type.
 * Also returns the CRUDP permission locale properties for the content type
 * so we know which locales the user can perform actions on.
 */
declare const useI18n: UseI18n;
export { useI18n };
