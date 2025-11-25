import { CoreService } from './core-service.mjs';

class SingleTypeService extends CoreService {
    async getDocumentId() {
        const { uid } = this.contentType;
        return strapi.db.query(uid).findOne().then((document)=>document?.documentId);
    }
    async find(params = {}) {
        const { uid } = this.contentType;
        return strapi.documents(uid).findFirst(this.getFetchParams(params));
    }
    async createOrUpdate(params = {}) {
        const { uid } = this.contentType;
        const documentId = await this.getDocumentId();
        if (documentId) {
            return strapi.documents(uid).update({
                ...this.getFetchParams(params),
                documentId
            });
        }
        return strapi.documents(uid).create(this.getFetchParams(params));
    }
    async delete(params = {}) {
        const { uid } = this.contentType;
        const documentId = await this.getDocumentId();
        if (!documentId) return {
            deletedEntries: 0
        };
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
const createSingleTypeService = (contentType)=>{
    return new SingleTypeService(contentType);
};

export { SingleTypeService, createSingleTypeService };
//# sourceMappingURL=single-type.mjs.map
