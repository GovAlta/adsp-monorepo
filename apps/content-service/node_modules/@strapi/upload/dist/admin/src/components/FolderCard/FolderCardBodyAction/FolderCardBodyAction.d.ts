import { BoxProps } from '@strapi/design-system';
import { LinkProps } from 'react-router-dom';
interface FolderCardBodyActionProps extends BoxProps {
    to?: LinkProps['to'];
}
export declare const FolderCardBodyAction: ({ to, ...props }: FolderCardBodyActionProps) => import("react/jsx-runtime").JSX.Element;
export {};
