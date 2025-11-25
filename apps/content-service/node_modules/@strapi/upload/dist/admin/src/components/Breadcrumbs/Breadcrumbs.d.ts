import { BreadcrumbsProps as BaseBreadcrumbsProps } from '@strapi/design-system';
import { MessageDescriptor } from 'react-intl';
export type CrumbDefinition = {
    id?: number | null;
    label?: MessageDescriptor | string;
    href?: string;
    path?: string;
};
export interface BreadcrumbsProps extends BaseBreadcrumbsProps {
    breadcrumbs: Array<CrumbDefinition>;
    currentFolderId?: number;
    onChangeFolder?: (id: number, path?: string) => void;
}
export declare const Breadcrumbs: ({ breadcrumbs, onChangeFolder, currentFolderId, ...props }: BreadcrumbsProps) => import("react/jsx-runtime").JSX.Element;
