import { databaseErrorsMiddleware } from './middlewares/errors.mjs';
import { createMiddlewareManager } from './middlewares/middleware-manager.mjs';
import { createContentTypeRepository } from './repository.mjs';
import { transformData } from './transform/data.mjs';
import entityValidator from '../entity-validator/index.mjs';

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
 */ const createDocumentService = (strapi, validator = entityValidator)=>{
    // Cache the repositories (one per content type)
    const repositories = new Map();
    // Manager to handle document service middlewares
    const middlewares = createMiddlewareManager();
    middlewares.use(databaseErrorsMiddleware);
    const factory = function factory(uid) {
        if (repositories.has(uid)) {
            return repositories.get(uid);
        }
        const contentType = strapi.contentType(uid);
        const repository = createContentTypeRepository(uid, validator);
        const instance = middlewares.wrapObject(repository, {
            uid,
            contentType
        }, {
            exclude: [
                'updateComponents',
                'omitComponentData'
            ]
        });
        repositories.set(uid, instance);
        return instance;
    };
    return Object.assign(factory, {
        utils: {
            transformData
        },
        use: middlewares.use.bind(middlewares)
    });
};

export { createDocumentService };
//# sourceMappingURL=index.mjs.map
