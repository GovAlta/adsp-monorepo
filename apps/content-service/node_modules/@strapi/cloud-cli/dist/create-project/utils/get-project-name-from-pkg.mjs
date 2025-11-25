import { loadPkg } from '../../utils/pkg.mjs';

async function getProjectNameFromPackageJson(ctx) {
    try {
        const packageJson = await loadPkg(ctx);
        return packageJson.name || 'my-strapi-project';
    } catch (e) {
        return 'my-strapi-project';
    }
}

export { getProjectNameFromPackageJson };
//# sourceMappingURL=get-project-name-from-pkg.mjs.map
