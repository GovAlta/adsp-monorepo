import type { OpenAPIV3_1 } from 'openapi-types';
import { RegistriesFactory } from '../../registries';
import type { DocumentContext, DocumentContextData } from '../../types';
import { TimerFactory } from '../../utils';
import type { PartialContext } from '../types';
import { AbstractContextFactory } from './abstract';
export declare class DocumentContextFactory extends AbstractContextFactory<Partial<OpenAPIV3_1.Document>> {
    constructor(registriesFactory?: RegistriesFactory, timerFactory?: TimerFactory);
    create(context: PartialContext<DocumentContextData>): DocumentContext;
}
//# sourceMappingURL=document.d.ts.map