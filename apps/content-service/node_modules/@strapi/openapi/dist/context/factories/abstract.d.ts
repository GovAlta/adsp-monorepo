import type { RegistriesFactory } from '../../registries';
import type { TimerFactory } from '../../utils';
import type { Context, ContextFactory, ContextOutput, PartialContext } from '../types';
export declare abstract class AbstractContextFactory<T> implements ContextFactory<T> {
    private readonly _registriesFactory;
    private readonly _timerFactory;
    protected constructor(registriesFactory: RegistriesFactory, timerFactory: TimerFactory);
    create(context: PartialContext<T>, defaultValue: T): Context<T>;
    protected createDefaultOutput(data: T): ContextOutput<T>;
}
//# sourceMappingURL=abstract.d.ts.map