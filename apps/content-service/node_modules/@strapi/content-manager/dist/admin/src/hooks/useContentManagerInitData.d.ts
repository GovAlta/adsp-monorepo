import { type Permission } from '@strapi/admin/strapi-admin';
import { AppState } from '../modules/app';
interface ContentManagerLink {
    permissions: Permission[];
    search: string | null;
    kind: string;
    title: string;
    to: string;
    uid: string;
    name: string;
    isDisplayed: boolean;
}
declare const useContentManagerInitData: () => AppState;
export { useContentManagerInitData };
export type { ContentManagerLink };
