import type { EditFieldLayout } from '../../hooks/useDocumentLayout';
import type { DistributiveOmit } from 'react-redux';
type VersionInputRendererProps = DistributiveOmit<EditFieldLayout, 'size'> & {
    /**
     * In the context of content history, deleted fields need to ignore RBAC
     * @default false
     */
    shouldIgnoreRBAC?: boolean;
};
/**
 * @internal
 *
 * @description An abstraction around the regular form input renderer designed specifically
 * to be used on the History page in the content-manager. It understands how to render specific
 * inputs within the context of a history version (i.e. relations, media, ignored RBAC, etc...)
 */
declare const VersionInputRenderer: ({ visible, hint: providedHint, shouldIgnoreRBAC, labelAction, ...props }: VersionInputRendererProps) => import("react/jsx-runtime").JSX.Element | null;
export type { VersionInputRendererProps };
export { VersionInputRenderer };
