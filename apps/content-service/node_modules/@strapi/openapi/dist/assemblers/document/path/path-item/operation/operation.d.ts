import type { Core } from '@strapi/types';
import { OperationContextFactory } from '../../../../../context';
import type { PathItemContext } from '../../../../../types';
import type { Assembler } from '../../../..';
export declare class OperationAssembler implements Assembler.PathItem {
    private readonly _assemblers;
    private readonly _contextFactory;
    constructor(assemblers: Assembler.Operation[], contextFactory?: OperationContextFactory);
    assemble(context: PathItemContext, path: string, routes: Core.Route[]): void;
    private _validateOperationObject;
    private _validateHTTPIndex;
}
//# sourceMappingURL=operation.d.ts.map