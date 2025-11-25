/**
 * Resolve the working directories based on the instance options.
 *
 * Behavior:
 * - `appDir` is the directory where Strapi will write every file (schemas, generated APIs, controllers or services)
 * - `distDir` is the directory where Strapi will read configurations, schemas and any compiled code
 *
 * Default values:
 * - If `appDir` is `undefined`, it'll be set to `process.cwd()`
 * - If `distDir` is `undefined`, it'll be set to `appDir`
 */
export declare const resolveWorkingDirectories: (opts: {
    appDir?: string;
    distDir?: string;
}) => {
    appDir: string;
    distDir: string;
};
//# sourceMappingURL=resolve-working-dirs.d.ts.map