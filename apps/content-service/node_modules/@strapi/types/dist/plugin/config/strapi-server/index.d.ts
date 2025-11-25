import type { Config } from './config';
import type { Routes } from './routes';
import type { ContentTypes } from './content-types';
import type { Controllers } from './controllers';
import type { Register, Bootstrap, Destroy } from './lifecycle';
export interface ServerObject {
    register: Register;
    bootstrap: Bootstrap;
    destroy: Destroy;
    config: Config;
    routes: Routes;
    contentTypes: ContentTypes;
    controllers: Controllers;
    registerTrads: unknown;
    services: unknown;
    policies: unknown;
    middlewares: unknown;
}
export type ServerFunction = () => ServerObject;
export type ServerInput = ServerObject | ServerFunction;
//# sourceMappingURL=index.d.ts.map