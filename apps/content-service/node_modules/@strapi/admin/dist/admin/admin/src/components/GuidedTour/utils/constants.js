'use strict';

const GUIDED_TOUR_REQUIRED_ACTIONS = {
    contentTypeBuilder: {
        createSchema: 'didCreateContentTypeSchema',
        addField: 'didAddFieldToSchema'
    },
    contentManager: {
        createContent: 'didCreateContent'
    },
    apiTokens: {
        createToken: 'didCreateApiToken',
        copyToken: 'didCopyApiToken'
    },
    strapiCloud: {}
};

exports.GUIDED_TOUR_REQUIRED_ACTIONS = GUIDED_TOUR_REQUIRED_ACTIONS;
//# sourceMappingURL=constants.js.map
