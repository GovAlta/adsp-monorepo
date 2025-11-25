import { pick, curry, pipe, prop, includes, isArray, merge, set, omit } from 'lodash/fp';

/**
 * Return the default attributes of a new {@link Action}
 * @return Partial<Action>
 */ const getDefaultActionAttributes = ()=>({
        options: {
            applyToProperties: null
        }
    });
/**
 * Get the list of all the valid attributes of an {@link Action}
 */ const actionFields = [
    'section',
    'displayName',
    'category',
    'subCategory',
    'pluginName',
    'subjects',
    'options',
    'actionId',
    'aliases'
];
/**
 * Remove unwanted attributes from an {@link Action}
 */ const sanitizeActionAttributes = pick(actionFields);
/**
 * Create and return an identifier for an {@link CreateActionPayload}.
 * The format is based on the action's source ({@link CreateActionPayload.pluginName} or 'application') and {@link CreateActionPayload.uid}.
 * @param {CreateActionPayload} attributes
 * @return {string}
 */ // TODO: TS - Use Common.UID
const computeActionId = (attributes)=>{
    const { pluginName, uid } = attributes;
    if (!pluginName) {
        return `api::${uid}`;
    }
    if (pluginName === 'admin') {
        return `admin::${uid}`;
    }
    return `plugin::${pluginName}.${uid}`;
};
/**
 * Assign an actionId attribute to an {@link CreateActionPayload} object
 */ const assignActionId = (attrs)=>set('actionId', computeActionId(attrs), attrs);
/**
 * Transform an action by adding or removing the {@link Action.subCategory} attribute
 * @param {Action} action - The action to process
 * @return {Action}
 */ const assignOrOmitSubCategory = (action)=>{
    const shouldHaveSubCategory = [
        'settings',
        'plugins'
    ].includes(action.section);
    return shouldHaveSubCategory ? set('subCategory', action.subCategory || 'general', action) : omit('subCategory', action);
};
/**
 * Check if a property can be applied to an {@link Action}
 */ const appliesToProperty = curry((property, action)=>{
    return pipe(prop('options.applyToProperties'), includes(property))(action);
});
/**
 * Check if an action applies to a subject
 */ const appliesToSubject = curry((subject, action)=>{
    return isArray(action.subjects) && includes(subject, action.subjects);
});
/**
 * Transform the given attributes into a domain representation of an Action
 */ const create = pipe(// Create and assign an action identifier to the action
// (need to be done before the sanitizeActionAttributes since we need the uid here)
assignActionId, // Add or remove the sub category field based on the pluginName attribute
assignOrOmitSubCategory, // Remove unwanted attributes from the payload
sanitizeActionAttributes, // Complete the action creation by adding default values for some attributes
merge(getDefaultActionAttributes()));
var actionDomain = {
    actionFields,
    appliesToProperty,
    appliesToSubject,
    assignActionId,
    assignOrOmitSubCategory,
    create,
    computeActionId,
    getDefaultActionAttributes,
    sanitizeActionAttributes
};

export { actionDomain as default };
//# sourceMappingURL=index.mjs.map
