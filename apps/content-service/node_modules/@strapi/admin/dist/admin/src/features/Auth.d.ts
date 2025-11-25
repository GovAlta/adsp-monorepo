import * as React from 'react';
import { Login } from '../../../shared/contracts/authentication';
import { useLoginMutation } from '../services/auth';
import type { Permission as PermissionContract, SanitizedAdminUser } from '../../../shared/contracts/shared';
interface Permission extends Pick<PermissionContract, 'action' | 'subject'>, Partial<Omit<PermissionContract, 'action' | 'subject'>> {
}
interface User extends Pick<SanitizedAdminUser, 'email' | 'firstname' | 'lastname' | 'username' | 'roles'>, Partial<Omit<SanitizedAdminUser, 'email' | 'firstname' | 'lastname' | 'username' | 'roles'>> {
}
interface AuthContextValue {
    login: (body: Login.Request['body'] & {
        rememberMe: boolean;
    }) => Promise<Awaited<ReturnType<ReturnType<typeof useLoginMutation>[0]>>>;
    logout: () => Promise<void>;
    /**
     * @alpha
     * @description given a list of permissions, this function checks
     * those against the current user's permissions or those passed as
     * the second argument, if the user has those permissions the complete
     * permission object form the API is returned. Therefore, if the list is
     * empty, the user does not have any of those permissions.
     */
    checkUserHasPermissions: (permissions?: Array<Pick<Permission, 'action'> & Partial<Omit<Permission, 'action'>>>, passedPermissions?: Permission[], rawQueryContext?: string) => Promise<Permission[]>;
    isLoading: boolean;
    permissions: Permission[];
    refetchPermissions: () => Promise<void>;
    token: string | null;
    user?: User;
}
declare const useAuth: <Selected, ShouldThrow extends boolean = true>(consumerName: string, selector: (value: AuthContextValue) => Selected, shouldThrowOnMissingContext?: ShouldThrow | undefined) => ShouldThrow extends true ? Selected : Selected | undefined;
interface AuthProviderProps {
    children: React.ReactNode;
    /**
     * @internal could be removed at any time.
     */
    _defaultPermissions?: Permission[];
    _disableRenewToken?: boolean;
}
declare const STORAGE_KEYS: {
    TOKEN: string;
    STATUS: string;
};
declare const AuthProvider: ({ children, _defaultPermissions, _disableRenewToken, }: AuthProviderProps) => import("react/jsx-runtime").JSX.Element;
export { AuthProvider, useAuth, STORAGE_KEYS };
export type { AuthContextValue, Permission, User };
