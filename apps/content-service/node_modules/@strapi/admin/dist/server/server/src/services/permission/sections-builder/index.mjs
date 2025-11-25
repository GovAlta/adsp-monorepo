import { propEq } from 'lodash/fp';
import createSectionBuilder from './builder.mjs';
import { plugins, settings, contentTypesBase, subjectsHandlerFor, fieldsProperty } from './handlers.mjs';

const sectionPropMatcher = propEq('section');
const createContentTypesInitialState = ()=>({
        actions: [],
        subjects: []
    });
const createDefaultSectionBuilder = ()=>{
    const builder = createSectionBuilder();
    builder.createSection('plugins', {
        initialStateFactory: ()=>[],
        handlers: [
            plugins
        ],
        matchers: [
            sectionPropMatcher('plugins')
        ]
    });
    builder.createSection('settings', {
        initialStateFactory: ()=>[],
        handlers: [
            settings
        ],
        matchers: [
            sectionPropMatcher('settings')
        ]
    });
    builder.createSection('singleTypes', {
        initialStateFactory: createContentTypesInitialState,
        handlers: [
            contentTypesBase,
            subjectsHandlerFor('singleType'),
            fieldsProperty
        ],
        matchers: [
            sectionPropMatcher('contentTypes')
        ]
    });
    builder.createSection('collectionTypes', {
        initialStateFactory: createContentTypesInitialState,
        handlers: [
            contentTypesBase,
            subjectsHandlerFor('collectionType'),
            fieldsProperty
        ],
        matchers: [
            sectionPropMatcher('contentTypes')
        ]
    });
    return builder;
};

export { createDefaultSectionBuilder as default };
//# sourceMappingURL=index.mjs.map
