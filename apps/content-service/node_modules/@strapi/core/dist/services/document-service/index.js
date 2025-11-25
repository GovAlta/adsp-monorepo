'use strict';

var errors = require('./middlewares/errors.js');
var middlewareManager = require('./middlewares/middleware-manager.js');
var repository = require('./repository.js');
var data = require('./transform/data.js');
var index = require('../entity-validator/index.js');

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
 */ const createDocumentService = (strapi, validator = index)=>{
    // Cache the repositories (one per content type)
    const repositories = new Map();
    // Manager to handle document service middlewares
    const middlewares = middlewareManager.createMiddlewareManager();
    middlewares.use(errors.databaseErrorsMiddleware);
    const factory = function factory(uid) {
        if (repositories.has(uid)) {
            return repositories.get(uid);
        }
        const contentType = strapi.contentType(uid);
        const repository$1 = repository.createContentTypeRepository(uid, validator);
        const instance = middlewares.wrapObject(repository$1, {
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
            transformData: data.transformData
        },
        use: middlewares.use.bind(middlewares)
    });
};

exports.createDocumentService = createDocumentService;
//# sourceMappingURL=index.js.map
