import { PermissionMap } from './types/permissions';
type ThemeName = 'light' | 'dark' | 'system';
interface AppState {
    language: {
        locale: string;
        localeNames: Record<string, string>;
    };
    permissions: Partial<PermissionMap>;
    theme: {
        currentTheme: ThemeName;
        availableThemes: string[];
    };
    token?: string | null;
}
declare const THEME_LOCAL_STORAGE_KEY = "STRAPI_THEME";
declare const LANGUAGE_LOCAL_STORAGE_KEY = "strapi-admin-language";
export declare const getStoredToken: () => string | null;
declare const reducer: import("redux").Reducer<AppState>;
export declare const setAppTheme: import("@reduxjs/toolkit").ActionCreatorWithPayload<ThemeName, "admin/setAppTheme">, setAvailableThemes: import("@reduxjs/toolkit").ActionCreatorWithPayload<string[], "admin/setAvailableThemes">, setLocale: import("@reduxjs/toolkit").ActionCreatorWithPayload<string, "admin/setLocale">, setToken: import("@reduxjs/toolkit").ActionCreatorWithPayload<string | null, "admin/setToken">, logout: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"admin/logout">, login: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    token: string;
    persist?: boolean | undefined;
}, "admin/login">;
export { reducer, THEME_LOCAL_STORAGE_KEY, LANGUAGE_LOCAL_STORAGE_KEY };
export type { AppState, ThemeName };
