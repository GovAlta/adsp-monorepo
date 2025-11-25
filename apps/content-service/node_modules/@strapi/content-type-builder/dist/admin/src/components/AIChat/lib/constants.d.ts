import type { Schema } from './types/schema';
export declare const STRAPI_CODE_MIME_TYPE = "application/vnd.strapi.code";
export declare const STRAPI_MAX_ATTACHMENTS = 15;
export declare const STRAPI_MAX_ATTACHMENT_SIZE: number;
export declare const STRAPI_AI_URL: string;
export declare const STRAPI_AI_CHAT_URL: string;
export declare const STRAPI_AI_TITLE_URL: "/schemas/chat/generate-title";
export declare const STRAPI_AI_FEEDBACK_URL: "/schemas/chat/feedback";
export declare const STRAPI_AI_PROJECT_URL: "/schemas/chat/attachment";
export interface ChatBody {
    schemas: Schema[];
}
