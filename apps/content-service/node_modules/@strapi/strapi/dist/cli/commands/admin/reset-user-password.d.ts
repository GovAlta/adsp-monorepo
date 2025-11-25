import type { StrapiCommand } from '../../types';
interface CmdOptions {
    email?: string;
    password?: string;
}
/**
 * Reset user's password
 */
declare const action: (cmdOptions?: CmdOptions) => Promise<void>;
/**
 * `$ strapi admin:reset-user-password`
 */
declare const command: StrapiCommand;
export { action, command };
//# sourceMappingURL=reset-user-password.d.ts.map