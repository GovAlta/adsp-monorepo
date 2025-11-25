import { SanitizedAdminUser } from '@strapi/admin/strapi-admin';
interface StageColumnProps {
    documentId?: string;
    id?: number;
    strapi_stage?: {
        color?: string;
        name: string;
    };
}
declare const StageColumn: (props: StageColumnProps) => import("react/jsx-runtime").JSX.Element;
interface AssigneeColumnProps {
    documentId?: string;
    id?: number;
    strapi_assignee?: Pick<SanitizedAdminUser, 'firstname' | 'lastname' | 'username' | 'email'> | null;
}
declare const AssigneeColumn: (props: AssigneeColumnProps) => import("react/jsx-runtime").JSX.Element;
export { StageColumn, AssigneeColumn };
export type { StageColumnProps, AssigneeColumnProps };
