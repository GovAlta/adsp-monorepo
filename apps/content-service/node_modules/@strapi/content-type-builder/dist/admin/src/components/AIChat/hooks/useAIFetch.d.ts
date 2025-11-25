import { UIMessage, useChat } from '@ai-sdk/react';
import { Attachment } from '../lib/types/attachments';
import { Schema } from '../lib/types/schema';
/**
 * Chat title
 */
export declare namespace GenerateTitle {
    interface Request {
        body: {
            chatId: string;
            message: string;
        };
    }
    interface Response {
        data: {
            title: string;
        };
        error?: string;
    }
}
/**
 * Upload a project to the chat
 */
export declare namespace UploadProject {
    interface Request {
        body: {
            chatId: string;
            name: string;
            type: 'code';
            files: {
                path: string;
                content: string;
            }[];
        };
    }
    interface Response {
        data: Attachment;
        error?: string;
    }
}
/**
 * Send chat feedback
 */
export type FeedbackReasonIds = 'invalid_schema' | 'bad_recommendation' | 'slow' | 'instructions_ignored' | 'being_lazy' | 'other';
declare namespace SendFeedback {
    interface Request {
        body: {
            chatId: string;
            type: 'upvote' | 'downvote';
            feedback?: string;
            reasons?: FeedbackReasonIds[];
            messageId: string;
            messages: UIMessage[];
            schemas: Schema[];
        };
    }
}
/**
 * Upload media
 */
export declare namespace UploadMedia {
    interface Request {
        body: {
            url: string;
            filename: string;
            chatId: string;
        };
    }
    interface Response {
        data: Attachment;
        error?: string;
    }
}
/**
 * Collection of API endpoints and their corresponding request/response types
 */
type AIEndpoints = {
    '/schemas/chat/generate-title': {
        request: GenerateTitle.Request;
        response: GenerateTitle.Response;
    };
    '/schemas/chat/attachment': {
        request: UploadProject.Request;
        response: UploadProject.Response;
    };
    '/schemas/chat/feedback': {
        request: SendFeedback.Request;
        response: void;
    };
    '/media/upload': {
        request: UploadMedia.Request;
        response: UploadMedia.Response;
    };
};
type RequestType<T extends keyof AIEndpoints> = AIEndpoints[T]['request'];
type ResponseType<T extends keyof AIEndpoints> = AIEndpoints[T]['response'];
export declare const TOO_MANY_REQUESTS_ERROR = "Too many requests";
export declare const LICENSE_LIMIT_REACHED_ERROR = "License limit";
export declare const LICENSE_LIMIT_EXCEEDED_ERROR = "AI credit limit exceeded";
export declare const CHAT_TOO_LONG_ERROR = "Chat too long";
export declare const ATTACHMENT_TOO_BIG_ERROR = "Attachment too big";
export declare const ATTACHMENT_NOT_FOUND_ERROR = "Attachment not found";
export declare const INVALID_REQUEST_ERROR = "Invalid request";
/**
 * Base hook factory for making type-safe API calls to Strapi AI endpoints.
 * Creates a hook specific to a single endpoint.
 */
export declare const createAIFetchHook: <T extends keyof AIEndpoints>(endpoint: T) => () => {
    isPending: boolean;
    error: string | null;
    fetch: (options?: Omit<RequestInit, 'body'> & Partial<RequestType<T>> & {
        formData?: FormData;
    }) => Promise<ResponseType<T> | null>;
};
export declare const useFetchGenerateTitle: () => {
    isPending: boolean;
    error: string | null;
    fetch: (options?: Omit<RequestInit, "body"> & Partial<GenerateTitle.Request> & {
        formData?: FormData | undefined;
    }) => Promise<GenerateTitle.Response | null>;
};
export declare const useFetchUploadProject: () => {
    isPending: boolean;
    error: string | null;
    fetch: (options?: Omit<RequestInit, "body"> & Partial<UploadProject.Request> & {
        formData?: FormData | undefined;
    }) => Promise<UploadProject.Response | null>;
};
export declare const useFetchSendFeedback: () => {
    isPending: boolean;
    error: string | null;
    fetch: (options?: Omit<RequestInit, "body"> & Partial<SendFeedback.Request> & {
        formData?: FormData | undefined;
    }) => Promise<void | null>;
};
export declare const useFetchUploadMedia: () => {
    isPending: boolean;
    error: string | null;
    fetch: (options?: Omit<RequestInit, "body"> & Partial<UploadMedia.Request> & {
        formData?: FormData | undefined;
    }) => Promise<UploadMedia.Response | null>;
};
/**
 * Hook wrapper for AI SDK's useChat with Strapi-specific configuration
 */
export declare const useAIChat: typeof useChat;
export {};
