import type { Core } from '@strapi/types';
import type { OperationContext } from '../../../../../types';
import type { Assembler } from '../../../..';
export declare class OperationIDAssembler implements Assembler.Operation {
    assemble(context: OperationContext, route: Core.Route): void;
    private _maybeAppendOrigin;
    private _appendMethod;
    private _maybeAppendPath;
}
//# sourceMappingURL=operation-id.d.ts.map