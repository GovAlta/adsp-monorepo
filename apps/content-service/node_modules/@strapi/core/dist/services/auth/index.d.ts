import type { Core } from '@strapi/types';
import type { ParameterizedContext } from 'koa';
interface AuthenticationResponse {
    authenticated?: boolean;
    credentials?: unknown;
    ability?: unknown;
    error?: Error | null;
}
interface AuthenticationInfo {
    strategy: Strategy;
    credentials: unknown;
    ability: unknown;
}
interface Strategy {
    name: string;
    authenticate: (ctx: ParameterizedContext) => Promise<AuthenticationResponse>;
    verify?: (auth: AuthenticationInfo, config: Core.RouteConfig['auth']) => Promise<any>;
}
interface Authentication {
    register: (type: string, strategy: Strategy) => Authentication;
    authenticate: Core.MiddlewareHandler;
    verify: (auth: AuthenticationInfo, config?: Core.RouteConfig['auth']) => Promise<any>;
}
declare const createAuthentication: () => Authentication;
export default createAuthentication;
//# sourceMappingURL=index.d.ts.map