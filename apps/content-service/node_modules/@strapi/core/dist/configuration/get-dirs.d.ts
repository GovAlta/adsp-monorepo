import type { Core } from '@strapi/types';
import type { StrapiOptions } from '../Strapi';
export type Options = {
    app: string;
    dist: string;
};
export declare const getDirs: ({ appDir, distDir }: StrapiOptions, config: {
    server: Partial<Core.Config.Server>;
}) => Core.StrapiDirectories;
//# sourceMappingURL=get-dirs.d.ts.map