'use strict';

var strapiUtils = require('@strapi/utils');
var fp = require('lodash/fp');

const addFirstPublishedAtToDraft = async (draft, update, contentType)=>{
    if (!strapiUtils.contentTypes.hasFirstPublishedAtField(contentType)) {
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
        return fp.assoc([
            'data',
            'firstPublishedAt'
        ], null, params);
    }
    return params;
};

exports.addFirstPublishedAtToDraft = addFirstPublishedAtToDraft;
exports.filterDataFirstPublishedAt = filterDataFirstPublishedAt;
//# sourceMappingURL=first-published-at.js.map
