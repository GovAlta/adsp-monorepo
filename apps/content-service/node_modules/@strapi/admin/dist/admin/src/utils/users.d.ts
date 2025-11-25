import type { User } from '../features/Auth';
/**
 * Retrieves the display name of an admin panel user
 */
declare const getDisplayName: ({ firstname, lastname, username, email }?: Partial<User>) => string;
/**
 * Retrieves the initials of the user (based on their firstname / lastname or their display name)
 */
declare const getInitials: (user?: Partial<User>) => string;
declare const hashAdminUserEmail: (payload?: User) => Promise<string | null>;
export { getDisplayName, getInitials, hashAdminUserEmail };
