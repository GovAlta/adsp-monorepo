import * as React from 'react';
interface FeedbackModalContextType {
    isFeedbackModalOpen: boolean;
    currentMessageId: string | null;
    openFeedbackModal: (messageId: string) => void;
    closeFeedbackModal: () => void;
}
export declare const useFeedbackModal: () => FeedbackModalContextType;
export declare const FeedbackProvider: ({ children }: {
    children: React.ReactNode;
}) => import("react/jsx-runtime").JSX.Element;
export declare const FeedbackModal: React.FC;
export {};
