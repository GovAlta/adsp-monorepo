import type { AdminUser } from '../../../shared/contracts/shared';
import '@strapi/types';
declare const _default: {
    checkCredentials: ({ email, password }: {
        email: string;
        password: string;
    }) => Promise<(AdminUser | null)[] | (boolean | {
        message: string;
    } | null)[]>;
    validatePassword: (password: string, hash: string) => Promise<boolean>;
    hashPassword: (password: string) => Promise<string>;
    forgotPassword: ({ email }?: {
        email: string;
    }) => Promise<any>;
    resetPassword: ({ resetPasswordToken, password }?: {
        resetPasswordToken: string;
        password: string;
    }) => Promise<AdminUser>;
};
export default _default;
//# sourceMappingURL=auth.d.ts.map