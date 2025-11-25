import { Attachment as TAttachment } from '../../lib/types/attachments';
import { AttachmentRootProps } from './components/Attachment';
interface AttachmentPreviewProps {
    attachment: TAttachment;
    loading?: boolean;
    onRemove?: () => void;
}
export declare const AttachmentPreview: ({ attachment, onRemove, ...props }: AttachmentPreviewProps & Omit<AttachmentRootProps, 'children'>) => import("react/jsx-runtime").JSX.Element | null;
export {};
