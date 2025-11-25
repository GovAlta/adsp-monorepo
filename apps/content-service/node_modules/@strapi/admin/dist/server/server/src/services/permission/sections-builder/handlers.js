'use strict';

var utils$1 = require('@strapi/utils');
var utils = require('./utils.js');

const { isVisibleAttribute } = utils$1.contentTypes;
/**
 * Transforms & adds the given  setting action to the section
 * Note: The action is transformed to a setting specific format
 * @param options
 * @param options.action
 * @param section
 */ const settings = ({ action, section })=>{
    const { category, subCategory, displayName, actionId } = action;
    section.push({
        displayName,
        category,
        subCategory,
        // TODO: Investigate at which point the action property is transformed to actionId
        // @ts-expect-error - action should be actionID
        action: actionId
    });
};
/**
 * Transforms & adds the given plugin action to the section
 * Note: The action is transformed to a plugin specific format
 * @param {object} options
 * @param {Action} options.action
 * @param {ActionArraySection} section
 */ const plugins = ({ action, section })=>{
    const { pluginName, subCategory, displayName, actionId } = action;
    section.push({
        displayName,
        // @ts-expect-error - plugin should be pluginName, TODO: Investigate at which point the plugin property
        plugin: pluginName,
        subCategory,
        action: actionId
    });
};
/**
 * Transforms & adds the given action to the section's actions field
 * Note: The action is transformed to a content-type specific format
 * @param {object} options
 * @param {Action} options.action
 * @param {ContentTypesSection} section
 */ const contentTypesBase = ({ action, section })=>{
    const { displayName, actionId, subjects, options } = action;
    section.actions.push({
        // @ts-expect-error - label should be displayName, TODO: Investigate at which point the label property
        label: displayName,
        actionId,
        subjects,
        ...utils.getValidOptions(options)
    });
};
/**
 * Initialize the subjects array of a section based on the action's subjects
 */ const subjectsHandlerFor = (kind)=>({ action, section: contentTypesSection })=>{
        // TODO: add a type guard for UID.ContentType
        const subjects = action.subjects;
        if (!subjects?.length) {
            return;
        }
        const newSubjects = subjects// Ignore already added subjects
        .filter(utils.isNotInSubjects(contentTypesSection.subjects))// Transform UIDs into content-types
        .map(utils.resolveContentType)// Only keep specific kind of content-types
        .filter(utils.isOfKind(kind))// Transform the content-types into section's subjects
        .map(utils.toSubjectTemplate);
        contentTypesSection.subjects.push(...newSubjects);
    };
const buildNode = (model, attributeName, attribute)=>{
    if (!isVisibleAttribute(model, attributeName)) {
        return null;
    }
    const node = {
        label: attributeName,
        value: attributeName
    };
    if (attribute.required) {
        Object.assign(node, {
            required: true
        });
    }
    if (attribute.type === 'component') {
        const component = strapi.components[attribute.component];
        return {
            ...node,
            children: buildDeepAttributesCollection(component)
        };
    }
    return node;
};
const buildDeepAttributesCollection = (model)=>{
    return Object.entries(model.attributes).map(([attributeName, attribute])=>buildNode(model, attributeName, attribute)).filter((node)=>node !== null);
};
/**
 * Create and populate the fields property for section's subjects based on the action's subjects list
 */ const fieldsProperty = ({ action, section })=>{
    const { subjects } = action;
    section.subjects.filter((subject)=>subjects?.includes(subject.uid)).forEach((subject)=>{
        const { uid } = subject;
        const contentType = utils.resolveContentType(uid);
        if (utils.hasProperty('fields', subject)) {
            return;
        }
        const fields = buildDeepAttributesCollection(contentType);
        const fieldsProp = {
            label: 'Fields',
            value: 'fields',
            children: fields
        };
        subject.properties.push(fieldsProp);
    });
};

exports.contentTypesBase = contentTypesBase;
exports.fieldsProperty = fieldsProperty;
exports.plugins = plugins;
exports.settings = settings;
exports.subjectsHandlerFor = subjectsHandlerFor;
//# sourceMappingURL=handlers.js.map
