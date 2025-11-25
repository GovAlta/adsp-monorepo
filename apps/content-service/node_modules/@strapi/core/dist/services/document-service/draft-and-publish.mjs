import { curry, assoc } from 'lodash/fp';
import { contentTypes } from '@strapi/utils';

/**
 * DP enabled -> set status to draft
 * DP disabled -> Used mostly for parsing relations, so there is not a need for a default.
 */ const setStatusToDraft = (contentType, params)=>{
    if (!contentTypes.hasDraftAndPublish(contentType) && params.status) {
        return params;
    }
    return assoc('status', 'draft', params);
};
/**
 * Adds a default status of `draft` to the params
 */ const defaultToDraft = (params)=>{
    // Default to draft if no status is provided or it's invalid
    if (!params.status || params.status !== 'published') {
        return assoc('status', 'draft', params);
    }
    return params;
};
/**
 * DP disabled -> ignore status
 * DP enabled -> set status to draft if no status is provided or it's invalid
 */ const defaultStatus = (contentType, params)=>{
    if (!contentTypes.hasDraftAndPublish(contentType)) {
        return params;
    }
    // Default to draft if no status is provided or it's invalid
    if (!params.status || params.status !== 'published') {
        return defaultToDraft(params);
    }
    return params;
};
/**
 * In mutating actions we don't want user to set the publishedAt attribute.
 */ const filterDataPublishedAt = (params)=>{
    if (params?.data?.publishedAt) {
        return assoc([
            'data',
            'publishedAt'
        ], null, params);
    }
    return params;
};
/**
 * Add status lookup query to the params
 */ const statusToLookup = (contentType, params)=>{
    if (!contentTypes.hasDraftAndPublish(contentType)) {
        return params;
    }
    const lookup = params.lookup || {};
    switch(params?.status){
        case 'published':
            return assoc([
                'lookup',
                'publishedAt'
            ], {
                $notNull: true
            }, params);
        case 'draft':
            return assoc([
                'lookup',
                'publishedAt'
            ], {
                $null: true
            }, params);
    }
    return assoc('lookup', lookup, params);
};
/**
 * Translate publication status parameter into the data that will be saved
 */ const statusToData = (contentType, params)=>{
    if (!contentTypes.hasDraftAndPublish(contentType)) {
        return assoc([
            'data',
            'publishedAt'
        ], new Date(), params);
    }
    switch(params?.status){
        case 'published':
            return assoc([
                'data',
                'publishedAt'
            ], new Date(), params);
        case 'draft':
            return assoc([
                'data',
                'publishedAt'
            ], null, params);
    }
    return params;
};
const setStatusToDraftCurry = curry(setStatusToDraft);
const defaultToDraftCurry = curry(defaultToDraft);
const defaultStatusCurry = curry(defaultStatus);
const filterDataPublishedAtCurry = curry(filterDataPublishedAt);
const statusToLookupCurry = curry(statusToLookup);
const statusToDataCurry = curry(statusToData);

export { defaultStatusCurry as defaultStatus, defaultToDraftCurry as defaultToDraft, filterDataPublishedAtCurry as filterDataPublishedAt, setStatusToDraftCurry as setStatusToDraft, statusToDataCurry as statusToData, statusToLookupCurry as statusToLookup };
//# sourceMappingURL=draft-and-publish.mjs.map
