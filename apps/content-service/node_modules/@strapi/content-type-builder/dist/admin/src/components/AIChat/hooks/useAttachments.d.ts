import type { Attachment } from '../lib/types/attachments';
export declare function useAttachments(): {
    attachments: Attachment[];
    attachFiles: (newFiles: File[], description?: string) => Promise<void>;
    addAttachments: (newAttachments: Attachment[]) => void;
    removeAttachment: (attachment: Attachment) => void;
    removeAttachmentByIndex: (index: number) => void;
};
