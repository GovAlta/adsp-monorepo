import type { Core, Modules } from '@strapi/types';
/**
 * Repository to :
 * - Access documents via actions (findMany, findOne, create, update, delete, ...)
 * - Execute middlewares on document actions
 * - Apply default parameters to document actions
 *
 * @param strapi
 * @param validator - validator for database entries
 * @returns DocumentService
 *
 * @example Access documents
 * const article = strapi.documents('api::article.article').create(params)
 * const allArticles = strapi.documents('api::article.article').findMany(params)
 *
 */
export declare const createDocumentService: (strapi: Core.Strapi, validator?: Modules.EntityValidator.EntityValidator) => Modules.Documents.Service;
//# sourceMappingURL=index.d.ts.map