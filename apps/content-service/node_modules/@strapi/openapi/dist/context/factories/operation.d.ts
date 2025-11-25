import type { OpenAPIV3_1 } from 'openapi-types';
import { RegistriesFactory } from '../../registries';
import type { OperationContext, OperationContextData } from '../../types';
import { TimerFactory } from '../../utils';
import type { PartialContext } from '../types';
import { AbstractContextFactory } from './abstract';
export declare class OperationContextFactory extends AbstractContextFactory<Partial<OpenAPIV3_1.OperationObject>> {
    constructor(registriesFactory?: RegistriesFactory, timerFactory?: TimerFactory);
    create(context: PartialContext<OperationContextData>): OperationContext;
}
//# sourceMappingURL=operation.d.ts.map