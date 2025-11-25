import ts from 'typescript';
import type { Logger } from './logger';
interface TsConfig {
    config: ts.ParsedCommandLine;
    path: string;
}
/**
 * @description Load a tsconfig.json file and return the parsed config.
 *
 * @internal
 */
declare const loadTsConfig: ({ cwd, path, logger, }: {
    cwd: string;
    path: string;
    logger: Logger;
}) => TsConfig | undefined;
export { loadTsConfig };
export type { TsConfig };
//# sourceMappingURL=tsconfig.d.ts.map