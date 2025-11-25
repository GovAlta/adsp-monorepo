import { RegistriesFactory } from '../../registries/factory.mjs';
import { TimerFactory } from '../../utils/timer/factory.mjs';
import 'debug';
import 'node:crypto';
import 'zod/v4';
import { AbstractContextFactory } from './abstract.mjs';

class DocumentContextFactory extends AbstractContextFactory {
    create(context) {
        return super.create(context, {});
    }
    constructor(registriesFactory = new RegistriesFactory(), timerFactory = new TimerFactory()){
        super(registriesFactory, timerFactory);
    }
}

export { DocumentContextFactory };
//# sourceMappingURL=document.mjs.map
