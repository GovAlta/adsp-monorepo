import { PathItemContextFactory } from '../../../../context';
import type { PathContext } from '../../../../types';
import type { Assembler } from '../../..';
export declare class PathItemAssembler implements Assembler.Path {
    private readonly _assemblers;
    private readonly _contextFactory;
    constructor(assemblers: Assembler.PathItem[], contextFactory: PathItemContextFactory);
    assemble(context: PathContext): void;
    private _createPathItemContext;
    private _formatPath;
    private _groupRoutesByPath;
}
//# sourceMappingURL=path-item.d.ts.map