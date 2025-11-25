import { ContentApiPermission } from '../../../../../../../../shared/contracts/content-api/permissions';
interface CollapsableContentTypeProps {
    controllers?: ContentApiPermission['controllers'];
    label: ContentApiPermission['label'];
    orderNumber?: number;
    disabled?: boolean;
}
export declare const CollapsableContentType: ({ controllers, label, orderNumber, disabled, }: CollapsableContentTypeProps) => import("react/jsx-runtime").JSX.Element;
export {};
