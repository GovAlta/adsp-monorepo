import type { Action } from '../../../domain/action';
export type ContentTypesSection = {
    actions: Action[];
    subjects: any[];
};
export type ActionArraySection = Action[];
/**
 * Transforms & adds the given  setting action to the section
 * Note: The action is transformed to a setting specific format
 * @param options
 * @param options.action
 * @param section
 */
declare const settings: ({ action, section }: {
    action: Action;
    section: ActionArraySection;
}) => void;
/**
 * Transforms & adds the given plugin action to the section
 * Note: The action is transformed to a plugin specific format
 * @param {object} options
 * @param {Action} options.action
 * @param {ActionArraySection} section
 */
declare const plugins: ({ action, section }: {
    action: Action;
    section: ActionArraySection;
}) => void;
/**
 * Transforms & adds the given action to the section's actions field
 * Note: The action is transformed to a content-type specific format
 * @param {object} options
 * @param {Action} options.action
 * @param {ContentTypesSection} section
 */
declare const contentTypesBase: ({ action, section, }: {
    action: Action;
    section: ContentTypesSection;
}) => void;
/**
 * Initialize the subjects array of a section based on the action's subjects
 */
declare const subjectsHandlerFor: (kind: string) => ({ action, section: contentTypesSection }: {
    action: Action;
    section: ContentTypesSection;
}) => void;
/**
 * Create and populate the fields property for section's subjects based on the action's subjects list
 */
declare const fieldsProperty: ({ action, section }: {
    action: Action;
    section: ContentTypesSection;
}) => void;
export { plugins, settings, subjectsHandlerFor, contentTypesBase, fieldsProperty };
//# sourceMappingURL=handlers.d.ts.map