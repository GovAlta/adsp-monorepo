/* eslint-disable @typescript-eslint/no-namespace */ const STRAPI_CODE_MIME_TYPE = 'application/vnd.strapi.code';
const STRAPI_MAX_ATTACHMENTS = 15;
const STRAPI_MAX_ATTACHMENT_SIZE = 15 * 1024 * 1024; // 15MB
/* -------------------------------------------------------------------------------------------------
 * APIs
 * -----------------------------------------------------------------------------------------------*/ const STRAPI_AI_URL = process.env.STRAPI_AI_URL?.replace(/\/+$/, '') ?? 'https://strapi-ai.apps.strapi.io';
const STRAPI_AI_CHAT_URL = `${STRAPI_AI_URL}/schemas/chat`;

export { STRAPI_AI_CHAT_URL, STRAPI_AI_URL, STRAPI_CODE_MIME_TYPE, STRAPI_MAX_ATTACHMENTS, STRAPI_MAX_ATTACHMENT_SIZE };
//# sourceMappingURL=constants.mjs.map
