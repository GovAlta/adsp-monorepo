import { PathContextFactory } from '../../../context';
import type { DocumentContext } from '../../../types';
import type { Assembler } from '../..';
export declare class DocumentPathsAssembler implements Assembler.Assembler {
    private readonly _assemblers;
    private readonly _contextFactory;
    constructor(assemblers: Assembler.Path[], _contextFactory: PathContextFactory);
    assemble(context: DocumentContext): void;
}
//# sourceMappingURL=path.d.ts.map