import type { Data } from '@strapi/types';
interface RoleInfo extends Omit<Entity, 'createdAt' | 'updatedAt'> {
    name: string;
    code: string;
    description?: string;
    usersCount?: number;
}
export interface UserInfo extends Entity {
    firstname: string;
    lastname?: string;
    username?: null | string;
    email: string;
    isActive: boolean;
    blocked: boolean;
    preferedLanguage: null | string;
    roles: RoleInfo[];
}
export interface Entity {
    documentId: string;
    id: Data.ID;
    createdAt: string;
    updatedAt: string;
}
export {};
