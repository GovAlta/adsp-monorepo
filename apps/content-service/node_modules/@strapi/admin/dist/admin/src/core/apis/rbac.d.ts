import { Location } from 'react-router-dom';
import type { Permission, User } from '../../features/Auth';
interface RBACContext extends Pick<Location, 'pathname' | 'search'> {
    /**
     * The current user.
     */
    user?: User;
    /**
     * The permissions of the current user.
     */
    permissions: Permission[];
}
interface RBACMiddleware {
    (ctx: RBACContext): (next: (permissions: Permission[]) => Promise<Permission[]> | Permission[]) => (permissions: Permission[]) => Promise<Permission[]> | Permission[];
}
declare class RBAC {
    private middlewares;
    constructor();
    use(middleware: RBACMiddleware[]): void;
    use(middleware: RBACMiddleware): void;
    run: (ctx: RBACContext, permissions: Permission[]) => Promise<Permission[]>;
}
export { RBAC };
export type { RBACMiddleware, RBACContext };
