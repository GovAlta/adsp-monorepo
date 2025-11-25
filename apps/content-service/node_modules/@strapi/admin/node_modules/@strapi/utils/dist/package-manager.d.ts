import execa from 'execa';
import type { Options as ProcessOptions } from 'execa';
type SupportedPackageManagerName = 'npm' | 'yarn';
export declare const getPreferred: (pkgPath: string) => Promise<SupportedPackageManagerName>;
export declare const installDependencies: (path: string, packageManager: SupportedPackageManagerName, options?: ProcessOptions<string>) => execa.ExecaChildProcess<string>;
export {};
//# sourceMappingURL=package-manager.d.ts.map