import { IconButtonProps } from '@strapi/design-system';
import type { AdminRole } from '../../../../../hooks/useAdminRoles';
interface RoleRowProps extends Pick<AdminRole, 'id' | 'name' | 'description' | 'usersCount'> {
    icons: Array<Required<Pick<IconButtonProps, 'children' | 'label' | 'onClick'>>>;
    rowIndex: number;
    canUpdate?: boolean;
    cursor?: string;
}
declare const RoleRow: ({ id, name, description, usersCount, icons, rowIndex, canUpdate, cursor, }: RoleRowProps) => import("react/jsx-runtime").JSX.Element;
export { RoleRow };
export type { RoleRowProps };
