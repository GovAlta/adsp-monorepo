'use strict';

var fp = require('lodash/fp');
var strapiUtils = require('@strapi/utils');

/**
 * DP enabled -> set status to draft
 * DP disabled -> Used mostly for parsing relations, so there is not a need for a default.
 */ const setStatusToDraft = (contentType, params)=>{
    if (!strapiUtils.contentTypes.hasDraftAndPublish(contentType) && params.status) {
        return params;
    }
    return fp.assoc('status', 'draft', params);
};
/**
 * Adds a default status of `draft` to the params
 */ const defaultToDraft = (params)=>{
    // Default to draft if no status is provided or it's invalid
    if (!params.status || params.status !== 'published') {
        return fp.assoc('status', 'draft', params);
    }
    return params;
};
/**
 * DP disabled -> ignore status
 * DP enabled -> set status to draft if no status is provided or it's invalid
 */ const defaultStatus = (contentType, params)=>{
    if (!strapiUtils.contentTypes.hasDraftAndPublish(contentType)) {
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
        return fp.assoc([
            'data',
            'publishedAt'
        ], null, params);
    }
    return params;
};
/**
 * Add status lookup query to the params
 */ const statusToLookup = (contentType, params)=>{
    if (!strapiUtils.contentTypes.hasDraftAndPublish(contentType)) {
        return params;
    }
    const lookup = params.lookup || {};
    switch(params?.status){
        case 'published':
            return fp.assoc([
                'lookup',
                'publishedAt'
            ], {
                $notNull: true
            }, params);
        case 'draft':
            return fp.assoc([
                'lookup',
                'publishedAt'
            ], {
                $null: true
            }, params);
    }
    return fp.assoc('lookup', lookup, params);
};
/**
 * Translate publication status parameter into the data that will be saved
 */ const statusToData = (contentType, params)=>{
    if (!strapiUtils.contentTypes.hasDraftAndPublish(contentType)) {
        return fp.assoc([
            'data',
            'publishedAt'
        ], new Date(), params);
    }
    switch(params?.status){
        case 'published':
            return fp.assoc([
                'data',
                'publishedAt'
            ], new Date(), params);
        case 'draft':
            return fp.assoc([
                'data',
                'publishedAt'
            ], null, params);
    }
    return params;
};
const setStatusToDraftCurry = fp.curry(setStatusToDraft);
const defaultToDraftCurry = fp.curry(defaultToDraft);
const defaultStatusCurry = fp.curry(defaultStatus);
const filterDataPublishedAtCurry = fp.curry(filterDataPublishedAt);
const statusToLookupCurry = fp.curry(statusToLookup);
const statusToDataCurry = fp.curry(statusToData);

exports.defaultStatus = defaultStatusCurry;
exports.defaultToDraft = defaultToDraftCurry;
exports.filterDataPublishedAt = filterDataPublishedAtCurry;
exports.setStatusToDraft = setStatusToDraftCurry;
exports.statusToData = statusToDataCurry;
exports.statusToLookup = statusToLookupCurry;
//# sourceMappingURL=draft-and-publish.js.map
