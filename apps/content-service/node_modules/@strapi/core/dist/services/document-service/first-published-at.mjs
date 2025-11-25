import { contentTypes } from '@strapi/utils';
import { assoc } from 'lodash/fp';

const addFirstPublishedAtToDraft = async (draft, update, contentType)=>{
    if (!contentTypes.hasFirstPublishedAtField(contentType)) {
        return draft;
    }
    if (draft.firstPublishedAt) {
        return draft;
    }
    return update(draft, {
        data: {
            firstPublishedAt: Date.now()
        }
    });
};
const filterDataFirstPublishedAt = (params)=>{
    if (params?.data?.firstPublishedAt) {
        return assoc([
            'data',
            'firstPublishedAt'
        ], null, params);
    }
    return params;
};

export { addFirstPublishedAtToDraft, filterDataFirstPublishedAt };
//# sourceMappingURL=first-published-at.mjs.map
