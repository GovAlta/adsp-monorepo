import { type ReactNode, type ChangeEvent } from 'react';
import { UIMessage, useChat } from '@ai-sdk/react';
import { Attachment } from '../lib/types/attachments';
import { Schema } from '../lib/types/schema';
interface ChatContextType extends Omit<ReturnType<typeof useChat>, 'messages'> {
    isChatEnabled: boolean;
    title?: string;
    messages: UIMessage[];
    handleSubmit: (event: any) => void;
    input: string;
    setInput: React.Dispatch<React.SetStateAction<string>>;
    handleInputChange: (e: ChangeEvent<HTMLInputElement> | ChangeEvent<HTMLTextAreaElement>) => void;
    reset: () => void;
    schemas: Schema[];
    isChatOpen: boolean;
    openChat: () => void;
    closeChat: () => void;
    attachments: Attachment[];
    setAttachments: React.Dispatch<React.SetStateAction<Attachment[]>>;
}
export declare const BaseChatProvider: ({ children, defaultOpen, }: {
    children: ReactNode;
    defaultOpen?: boolean;
}) => import("react/jsx-runtime").JSX.Element;
export declare const ChatProvider: ({ children, defaultOpen, }: {
    children: React.ReactNode;
    defaultOpen?: boolean;
}) => import("react/jsx-runtime").JSX.Element;
export declare function useStrapiChat(): ChatContextType;
export {};
