interface StrapiMonorepo {
    path: string;
}
/**
 * Load information about the strapi CMS monorepo (if applicable)
 *
 * @internal
 */
declare function loadStrapiMonorepo(cwd: string): Promise<StrapiMonorepo | undefined>;
export { loadStrapiMonorepo };
export type { StrapiMonorepo };
//# sourceMappingURL=monorepo.d.ts.map