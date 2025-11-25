import { PackageJson } from 'read-pkg-up';
import type { BuildOptions } from '../build';
interface CheckRequiredDependenciesResult {
    didInstall: boolean;
}
/**
 * Checks the user's project that it has declared and installed the required dependencies
 * needed by the Strapi admin project. Whilst generally speaking most modules will be
 * declared by the actual packages there are some packages where you only really want one of
 * and thus they are declared as peer dependencies – react / styled-components / etc.
 *
 * If these deps are not installed or declared, then we prompt the user to correct this. In
 * V4 this is not a hard requirement, but in V5 it will be. Might as well get people started now.
 */
declare const checkRequiredDependencies: ({ cwd, logger, }: Pick<BuildOptions, 'cwd' | 'logger'>) => Promise<CheckRequiredDependenciesResult>;
declare const getModule: (name: string, cwd: string) => Promise<PackageJson | null>;
export { checkRequiredDependencies, getModule };
export type { CheckRequiredDependenciesResult, PackageJson };
//# sourceMappingURL=dependencies.d.ts.map