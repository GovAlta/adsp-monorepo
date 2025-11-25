'use strict';

var pagination = require('./pagination.js');
var coreService = require('./core-service.js');

class CollectionTypeService extends coreService.CoreService {
    async find(params = {}) {
        const { uid } = this.contentType;
        const fetchParams = this.getFetchParams(params);
        const paginationInfo = pagination.getPaginationInfo(fetchParams);
        const isPaged = pagination.isPagedPagination(fetchParams.pagination);
        const results = await strapi.documents(uid).findMany({
            ...fetchParams,
            ...paginationInfo
        });
        if (pagination.shouldCount(fetchParams)) {
            const count = await strapi.documents(uid).count({
                ...fetchParams,
                ...paginationInfo
            });
            if (typeof count !== 'number') {
                throw new Error('Count should be a number');
            }
            return {
                results,
                pagination: pagination.transformPaginationResponse(paginationInfo, count, isPaged)
            };
        }
        return {
            results,
            pagination: pagination.transformPaginationResponse(paginationInfo, undefined, isPaged)
        };
    }
    findOne(documentId, params = {}) {
        const { uid } = this.contentType;
        return strapi.documents(uid).findOne({
            ...this.getFetchParams(params),
            documentId
        });
    }
    async create(params = {
        data: {}
    }) {
        const { uid } = this.contentType;
        return strapi.documents(uid).create(this.getFetchParams(params));
    }
    update(documentId, params = {
        data: {}
    }) {
        const { uid } = this.contentType;
        return strapi.documents(uid).update({
            ...this.getFetchParams(params),
            documentId
        });
    }
    async delete(documentId, params = {}) {
        const { uid } = this.contentType;
        const { entries } = await strapi.documents(uid).delete({
            ...this.getFetchParams(params),
            documentId
        });
        return {
            deletedEntries: entries.length
        };
    }
    constructor(contentType){
        super();
        this.contentType = contentType;
    }
}
/**
 *
 * Returns a collection type service to handle default core-api actions
 */ const createCollectionTypeService = (contentType)=>{
    return new CollectionTypeService(contentType);
};

exports.CollectionTypeService = CollectionTypeService;
exports.createCollectionTypeService = createCollectionTypeService;
//# sourceMappingURL=collection-type.js.map
