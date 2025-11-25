import type { Core } from '@strapi/types';
import type { Assembler } from '../../../..';
import type { OperationContext } from '../../../../../types';
export declare class OperationParametersAssembler implements Assembler.Operation {
    assemble(context: OperationContext, route: Core.Route): void;
    private _getPathParameters;
    private _getQueryParameters;
}
//# sourceMappingURL=parameters.d.ts.map