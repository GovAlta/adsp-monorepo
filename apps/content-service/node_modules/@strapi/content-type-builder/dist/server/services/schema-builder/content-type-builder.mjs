import path__default from 'path';
import _ from 'lodash';
import { strings, errors } from '@strapi/utils';
import { isRelation, isConfigurable } from '../../utils/attributes.mjs';
import { typeKinds } from '../constants.mjs';
import createSchemaHandler from './schema-handler.mjs';

const { ApplicationError } = errors;
const reuseUnsetPreviousProperties = (newAttribute, oldAttribute)=>{
    _.defaults(newAttribute, _.omit(oldAttribute, [
        'configurable',
        'required',
        'private',
        'unique',
        'pluginOptions',
        'inversedBy',
        'mappedBy',
        'conditions'
    ]));
};
function createComponentBuilder() {
    return {
        setRelation ({ key, uid, attribute }) {
            if (!_.has(attribute, 'target')) {
                return;
            }
            const targetCT = this.contentTypes.get(attribute.target);
            if (!targetCT) {
                throw new ApplicationError(`Content type ${attribute.target} not found`);
            }
            const targetAttribute = targetCT.getAttribute(attribute.targetAttribute);
            if (!attribute.targetAttribute) {
                return;
            }
            // When generating the inverse relation, preserve existing conditions if they exist
            // If the target attribute already exists and has conditions, preserve them
            const targetAttributeData = targetAttribute || {};
            // If the source doesn't have conditions but the target does, preserve target's conditions
            targetCT.setAttribute(attribute.targetAttribute, generateRelation({
                key,
                attribute,
                uid,
                targetAttribute: targetAttributeData
            }));
        },
        unsetRelation (attribute) {
            if (!('target' in attribute) || !attribute.target) {
                return;
            }
            const targetCT = this.contentTypes.get(attribute.target);
            const relationAttribute = attribute;
            const targetAttributeName = relationAttribute.inversedBy || relationAttribute.mappedBy;
            const targetAttribute = targetCT.getAttribute(targetAttributeName);
            if (!targetAttribute) return;
            return targetCT.deleteAttribute(targetAttributeName);
        },
        createContentTypeAttributes (uid, attributes) {
            if (!this.contentTypes.has(uid)) {
                throw new ApplicationError('contentType.notFound');
            }
            const contentType = this.contentTypes.get(uid);
            // support self referencing content type relation
            Object.keys(attributes).forEach((key)=>{
                const { target } = attributes[key];
                if (target === '__self__') {
                    attributes[key].target = uid;
                }
            });
            contentType.setAttributes(this.convertAttributes(attributes));
            Object.keys(attributes).forEach((key)=>{
                const attribute = attributes[key];
                if (isRelation(attribute)) {
                    const relationAttribute = attribute;
                    if ([
                        'manyToMany',
                        'oneToOne'
                    ].includes(relationAttribute.relation)) {
                        if (relationAttribute.target === uid && relationAttribute.targetAttribute !== undefined) {
                            // self referencing relation
                            const targetAttribute = attributes[relationAttribute.targetAttribute];
                            if (targetAttribute.dominant === undefined) {
                                relationAttribute.dominant = true;
                            } else {
                                relationAttribute.dominant = false;
                            }
                        } else {
                            relationAttribute.dominant = true;
                        }
                    }
                    this.setRelation({
                        key,
                        uid,
                        attribute: relationAttribute
                    });
                }
            });
            return contentType;
        },
        /**
     * Creates a content type in memory to be written to files later on
     */ createContentType (infos) {
            // TODO:: check for unique uid / singularName & pluralName & collectionName
            if (infos.uid && infos.uid !== createContentTypeUID(infos)) {
                throw new ApplicationError('contentType.invalidUID');
            }
            const uid = infos.uid ?? createContentTypeUID(infos);
            if (this.contentTypes.has(uid)) {
                throw new ApplicationError('contentType.alreadyExists');
            }
            const contentType = createSchemaHandler({
                modelName: infos.singularName,
                dir: path__default.join(strapi.dirs.app.api, infos.singularName, 'content-types', infos.singularName),
                filename: `schema.json`
            });
            this.contentTypes.set(uid, contentType);
            contentType.setUID(uid).set('kind', infos.kind || typeKinds.COLLECTION_TYPE).set('collectionName', infos.collectionName || strings.nameToCollectionName(infos.pluralName)).set('info', {
                singularName: infos.singularName,
                pluralName: infos.pluralName,
                displayName: infos.displayName,
                description: infos.description
            }).set('options', {
                ...infos.options ?? {},
                draftAndPublish: infos.draftAndPublish
            }).set('pluginOptions', infos.pluginOptions).set('config', infos.config);
            this.createContentTypeAttributes(uid, infos.attributes);
            return contentType;
        },
        editContentType (infos) {
            const { uid } = infos;
            if (!this.contentTypes.has(uid)) {
                throw new ApplicationError('contentType.notFound');
            }
            const contentType = this.contentTypes.get(uid);
            const oldAttributes = contentType.schema.attributes;
            const newAttributes = _.omitBy(infos.attributes, (attr, key)=>{
                return _.has(oldAttributes, key) && !isConfigurable(oldAttributes[key]);
            });
            const newKeys = _.difference(Object.keys(newAttributes), Object.keys(oldAttributes));
            const deletedKeys = _.difference(Object.keys(oldAttributes), Object.keys(newAttributes));
            const remainingKeys = _.intersection(Object.keys(oldAttributes), Object.keys(newAttributes));
            // remove old relations
            deletedKeys.forEach((key)=>{
                const attribute = oldAttributes[key];
                // if the old relation has a target attribute. we need to remove it in the target type
                if (isConfigurable(attribute) && isRelation(attribute)) {
                    const relationAttribute = attribute;
                    const targetAttributeName = relationAttribute.inversedBy || relationAttribute.mappedBy;
                    if (targetAttributeName !== null && targetAttributeName !== undefined) {
                        this.unsetRelation(attribute);
                    }
                }
            });
            remainingKeys.forEach((key)=>{
                const oldAttribute = oldAttributes[key];
                const newAttribute = newAttributes[key];
                if (!isRelation(oldAttribute) && isRelation(newAttribute)) {
                    return this.setRelation({
                        key,
                        uid,
                        attribute: newAttribute
                    });
                }
                if (isRelation(oldAttribute) && !isRelation(newAttribute)) {
                    return this.unsetRelation(oldAttribute);
                }
                if (isRelation(oldAttribute) && isRelation(newAttribute)) {
                    const relationAttribute = newAttribute;
                    const oldRelationAttribute = oldAttribute;
                    const oldTargetAttributeName = oldRelationAttribute.inversedBy || oldRelationAttribute.mappedBy;
                    const sameRelation = oldAttribute.relation === relationAttribute.relation;
                    const targetAttributeHasChanged = oldTargetAttributeName !== relationAttribute.targetAttribute;
                    if (!sameRelation || targetAttributeHasChanged) {
                        this.unsetRelation(oldAttribute);
                    }
                    // keep extra options that were set manually on oldAttribute
                    reuseUnsetPreviousProperties(relationAttribute, oldAttribute);
                    // Handle conditions explicitly - only preserve if present and not undefined in new attribute
                    const newAttributeFromInfos = newAttributes[key];
                    const hasNewConditions = newAttributeFromInfos.conditions !== undefined && newAttributeFromInfos.conditions !== null;
                    if (oldAttribute.conditions) {
                        if (hasNewConditions) {
                            // Conditions are still present, keep them
                            relationAttribute.conditions = newAttributeFromInfos.conditions;
                        } else {
                            // Conditions were removed (undefined or null), ensure they're not preserved
                            delete relationAttribute.conditions;
                        }
                    } else if (hasNewConditions) {
                        // New conditions added
                        relationAttribute.conditions = newAttributeFromInfos.conditions;
                    }
                    if (oldRelationAttribute.inversedBy) {
                        relationAttribute.dominant = true;
                    } else if (oldRelationAttribute.mappedBy) {
                        relationAttribute.dominant = false;
                    }
                    return this.setRelation({
                        key,
                        uid,
                        attribute: relationAttribute
                    });
                }
            });
            // add new relations
            newKeys.forEach((key)=>{
                const attribute = newAttributes[key];
                if (isRelation(attribute)) {
                    const relationAttribute = attribute;
                    if ([
                        'manyToMany',
                        'oneToOne'
                    ].includes(relationAttribute.relation)) {
                        if (relationAttribute.target === uid && relationAttribute.targetAttribute !== undefined) {
                            // self referencing relation
                            const targetAttribute = newAttributes[relationAttribute.targetAttribute];
                            if (targetAttribute.dominant === undefined) {
                                relationAttribute.dominant = true;
                            } else {
                                relationAttribute.dominant = false;
                            }
                        } else {
                            relationAttribute.dominant = true;
                        }
                    }
                    this.setRelation({
                        key,
                        uid,
                        attribute: relationAttribute
                    });
                }
            });
            contentType.set('kind', infos.kind || contentType.schema.kind).set([
                'info',
                'displayName'
            ], infos.displayName).set([
                'info',
                'description'
            ], infos.description).set('options', {
                ...infos.options ?? {},
                draftAndPublish: infos.draftAndPublish
            }).set('pluginOptions', infos.pluginOptions).setAttributes(this.convertAttributes(newAttributes));
            return contentType;
        },
        deleteContentType (uid) {
            if (!this.contentTypes.has(uid)) {
                throw new ApplicationError('contentType.notFound');
            }
            this.components.forEach((compo)=>{
                compo.removeContentType(uid);
            });
            this.contentTypes.forEach((ct)=>{
                ct.removeContentType(uid);
            });
            return this.contentTypes.get(uid).delete();
        }
    };
}
/**
 * Returns a uid from a content type infos
 *
 * @param {object} options options
 * @param {string} options.singularName content-type singularName
 * @returns {string} uid
 */ const createContentTypeUID = ({ singularName })=>`api::${singularName}.${singularName}`;
const generateRelation = ({ key, attribute, uid, targetAttribute = {} })=>{
    const opts = {
        type: 'relation',
        target: uid,
        private: targetAttribute.private || undefined,
        pluginOptions: targetAttribute.pluginOptions || undefined,
        // Preserve conditions from targetAttribute if they exist
        // This allows each side of the relation to maintain its own conditions
        ...targetAttribute.conditions && {
            conditions: targetAttribute.conditions
        }
    };
    switch(attribute.relation){
        case 'oneToOne':
            {
                opts.relation = 'oneToOne';
                if (attribute.dominant) {
                    opts.mappedBy = key;
                } else {
                    opts.inversedBy = key;
                }
                break;
            }
        case 'oneToMany':
            {
                opts.relation = 'manyToOne';
                opts.inversedBy = key;
                break;
            }
        case 'manyToOne':
            {
                opts.relation = 'oneToMany';
                opts.mappedBy = key;
                break;
            }
        case 'manyToMany':
            {
                opts.relation = 'manyToMany';
                if (attribute.dominant) {
                    opts.mappedBy = key;
                } else {
                    opts.inversedBy = key;
                }
                break;
            }
    }
    // we do this just to make sure we have the same key order when writing to files
    const { type, relation, target, ...restOptions } = opts;
    const result = {
        type,
        relation,
        target,
        ...restOptions
    };
    return result;
};

export { createComponentBuilder as default };
//# sourceMappingURL=content-type-builder.mjs.map
