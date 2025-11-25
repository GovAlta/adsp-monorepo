import { RegistriesFactory } from '../../registries';
import type { PathItemContext, PathItemContextData } from '../../types';
import { TimerFactory } from '../../utils';
import type { PartialContext } from '../types';
import { AbstractContextFactory } from './abstract';
export declare class PathItemContextFactory extends AbstractContextFactory<PathItemContextData> {
    constructor(registriesFactory?: RegistriesFactory, timerFactory?: TimerFactory);
    create(context: PartialContext<PathItemContextData>): PathItemContext;
}
//# sourceMappingURL=path-item.d.ts.map