'use strict';

var utils = require('@strapi/utils');
var index = require('../../utils/index.js');
var constants = require('../../constants.js');

function isFile(value, attribute) {
    if (!value || attribute.type !== 'media') {
        return false;
    }
    return true;
}
/**
 * Visitor function to sign media URLs
 */ const signEntityMediaVisitor = async ({ key, value, attribute }, { set })=>{
    const { signFileUrls } = index.getService('file');
    if (!attribute) {
        return;
    }
    if (attribute.type !== 'media') {
        return;
    }
    if (isFile(value, attribute)) {
        // If the attribute is repeatable sign each file
        if (attribute.multiple) {
            const signedFiles = await utils.async.map(value, signFileUrls);
            set(key, signedFiles);
            return;
        }
        // If the attribute is not repeatable only sign a single file
        const signedFile = await signFileUrls(value);
        set(key, signedFile);
    }
};
/**
 *
 * Iterate through an entity manager result
 * Check which modelAttributes are media and pre sign the image URLs
 * if they are from the current upload provider
 *
 * @param {Object} entity
 * @param {Object} modelAttributes
 * @returns
 */ const signEntityMedia = async (entity, uid)=>{
    if (!entity) {
        return entity;
    }
    // If the entity itself is a file, sign it directly
    if (uid === constants.FILE_MODEL_UID) {
        const { signFileUrls } = index.getService('file');
        return signFileUrls(entity);
    }
    // If the entity is a regular content type, look for media attributes
    const model = strapi.getModel(uid);
    return utils.traverseEntity(// @ts-expect-error - FIXME: fix traverseEntity using wrong types
    signEntityMediaVisitor, {
        schema: model,
        getModel: strapi.getModel.bind(strapi)
    }, entity);
};

exports.signEntityMedia = signEntityMedia;
//# sourceMappingURL=utils.js.map
