import type { BaseContext } from '../types';
interface AdminCustomisations {
    config?: {
        locales?: string[];
    };
    bootstrap?: (...args: any[]) => any;
}
interface AppFile {
    /**
     * The system path to the file
     */
    path: string;
    /**
     * The module path to the file i.e. how you would import it
     */
    modulePath: string;
}
declare const loadUserAppFile: ({ runtimeDir, appDir, }: Pick<BaseContext, 'appDir' | 'runtimeDir'>) => Promise<AppFile | undefined>;
export { loadUserAppFile };
export type { AdminCustomisations, AppFile };
//# sourceMappingURL=admin-customisations.d.ts.map