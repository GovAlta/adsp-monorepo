import type { StrapiApp } from '@strapi/admin/strapi-admin';
declare const _default: {
    register(app: StrapiApp): void;
    bootstrap(): void;
    registerTrads({ locales }: {
        locales: string[];
    }): Promise<({
        data: {
            [x: string]: string;
        };
        locale: string;
    } | {
        data: {};
        locale: string;
    })[]>;
};
export default _default;
export * from './exports';
