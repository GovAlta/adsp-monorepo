import { FeedbackReasonIds } from './useAIFetch';
export declare const useFeedback: () => {
    upvoteMessage: (messageId: string) => Promise<void | null>;
    downvoteMessage: (messageId: string, feedback: string, reasons: FeedbackReasonIds[]) => Promise<void | null>;
    isPending: boolean;
    error: string | null;
};
