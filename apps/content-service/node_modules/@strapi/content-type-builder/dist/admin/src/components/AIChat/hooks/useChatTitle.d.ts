import type { UIMessage } from '@ai-sdk/react';
interface UseChatTitleProps {
    chatId: string;
    messages: UIMessage[];
}
export declare const useChatTitle: ({ chatId, messages }: UseChatTitleProps) => {
    title: string | undefined;
    isGenerating: boolean;
    error: string | null;
    generateTitle: () => Promise<void>;
    resetTitle: () => void;
};
export {};
