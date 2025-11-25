'use strict';

var fp = require('lodash/fp');
var builder = require('./builder.js');
var handlers = require('./handlers.js');

const sectionPropMatcher = fp.propEq('section');
const createContentTypesInitialState = ()=>({
        actions: [],
        subjects: []
    });
const createDefaultSectionBuilder = ()=>{
    const builder$1 = builder();
    builder$1.createSection('plugins', {
        initialStateFactory: ()=>[],
        handlers: [
            handlers.plugins
        ],
        matchers: [
            sectionPropMatcher('plugins')
        ]
    });
    builder$1.createSection('settings', {
        initialStateFactory: ()=>[],
        handlers: [
            handlers.settings
        ],
        matchers: [
            sectionPropMatcher('settings')
        ]
    });
    builder$1.createSection('singleTypes', {
        initialStateFactory: createContentTypesInitialState,
        handlers: [
            handlers.contentTypesBase,
            handlers.subjectsHandlerFor('singleType'),
            handlers.fieldsProperty
        ],
        matchers: [
            sectionPropMatcher('contentTypes')
        ]
    });
    builder$1.createSection('collectionTypes', {
        initialStateFactory: createContentTypesInitialState,
        handlers: [
            handlers.contentTypesBase,
            handlers.subjectsHandlerFor('collectionType'),
            handlers.fieldsProperty
        ],
        matchers: [
            sectionPropMatcher('contentTypes')
        ]
    });
    return builder$1;
};

module.exports = createDefaultSectionBuilder;
//# sourceMappingURL=index.js.map
