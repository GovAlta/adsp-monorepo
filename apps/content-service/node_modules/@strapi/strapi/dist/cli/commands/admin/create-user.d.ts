import type { StrapiCommand } from '../../types';
interface CmdOptions {
    email?: string;
    password?: string;
    firstname?: string;
    lastname?: string;
}
/**
 * Create new admin user
 */
declare const action: (cmdOptions?: CmdOptions) => Promise<void>;
/**
 * `$ strapi admin:create-user`
 */
declare const command: StrapiCommand;
export { action, command };
//# sourceMappingURL=create-user.d.ts.map