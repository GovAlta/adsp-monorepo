import { RegistriesFactory } from '../../registries';
import type { PathContext, PathContextData } from '../../types';
import { TimerFactory } from '../../utils';
import type { PartialContext } from '../types';
import { AbstractContextFactory } from './abstract';
export declare class PathContextFactory extends AbstractContextFactory<PathContextData> {
    constructor(registriesFactory?: RegistriesFactory, timerFactory?: TimerFactory);
    create(context: PartialContext<PathContextData>): PathContext;
}
//# sourceMappingURL=path.d.ts.map