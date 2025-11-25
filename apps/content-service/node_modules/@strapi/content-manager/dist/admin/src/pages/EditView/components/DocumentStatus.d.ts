import { StatusProps } from '@strapi/design-system';
interface DocumentStatusProps extends Omit<StatusProps, 'children' | 'variant'> {
    /**
     * The status of the document (draft, published, etc.)
     * @default 'draft'
     */
    status?: string;
}
/**
 * @public
 * @description Displays the status of a document (draft, published, etc.)
 * and automatically calculates the appropriate variant for the status.
 */
declare const DocumentStatus: ({ status, size, ...restProps }: DocumentStatusProps) => import("react/jsx-runtime").JSX.Element;
export { DocumentStatus };
export type { DocumentStatusProps };
