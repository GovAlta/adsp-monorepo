'use strict';

var fp = require('lodash/fp');
var utils = require('@strapi/utils');
var constants = require('../../services/constants.js');
var common = require('./common.js');

const STRAPI_USER_RELATIONS = [
    'oneToOne',
    'oneToMany'
];
const isValidRelation = (validNatures)=>function(value) {
        // NOTE: In case of an undefined value, delegate the check to .required()
        if (value === undefined) {
            return true;
        }
        if (this.parent.target === constants.coreUids.STRAPI_USER) {
            if (!validNatures.includes(value) || !fp.isUndefined(this.parent.targetAttribute)) {
                return this.createError({
                    path: this.path,
                    message: `must be one of the following values: ${STRAPI_USER_RELATIONS.join(', ')}`
                });
            }
        }
        return validNatures.includes(value) ? true : this.createError({
            path: this.path,
            message: `must be one of the following values: ${validNatures.join(', ')}`
        });
    };
const getRelationValidator = (attribute, allowedRelations)=>{
    const contentTypesUIDs = Object.keys(strapi.contentTypes).filter((key)=>strapi.contentTypes[key].kind === constants.typeKinds.COLLECTION_TYPE).filter((key)=>!key.startsWith(constants.coreUids.PREFIX) || key === constants.coreUids.STRAPI_USER).concat([
        '__self__',
        '__contentType__'
    ]);
    const base = {
        type: utils.yup.string().oneOf([
            'relation'
        ]).required(),
        relation: utils.yup.string().test('isValidRelation', isValidRelation(allowedRelations)).required(),
        configurable: utils.yup.boolean().nullable(),
        private: utils.yup.boolean().nullable(),
        pluginOptions: utils.yup.object()
    };
    switch(attribute.relation){
        case 'oneToOne':
        case 'oneToMany':
        case 'manyToOne':
        case 'manyToMany':
        case 'morphOne':
        case 'morphMany':
            {
                return utils.yup.object({
                    ...base,
                    target: utils.yup.string().oneOf(contentTypesUIDs).required(),
                    targetAttribute: utils.yup.string().test(common.isValidName).nullable()
                });
            }
        case 'morphToOne':
        case 'morphToMany':
        default:
            {
                return utils.yup.object({
                    ...base
                });
            }
    }
};

exports.getRelationValidator = getRelationValidator;
//# sourceMappingURL=relations.js.map
