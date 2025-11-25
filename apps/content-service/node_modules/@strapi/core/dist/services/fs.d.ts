import type { Core } from '@strapi/types';
interface StrapiFS {
    writeAppFile(optPath: string | string[], data: string): Promise<void>;
    writePluginFile(plugin: string, optPath: string | string[], data: string): Promise<void>;
    removeAppFile(optPath: string | string[]): Promise<void>;
    appendFile(optPath: string | string[], data: string): void;
}
/**
 * create strapi fs layer
 */
declare const _default: (strapi: Core.Strapi) => StrapiFS;
export default _default;
//# sourceMappingURL=fs.d.ts.map