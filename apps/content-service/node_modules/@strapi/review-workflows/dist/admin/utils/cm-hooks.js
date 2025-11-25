'use strict';

var constants = require('../routes/content-manager/model/constants.js');

const addColumnToTableHook = ({ displayedHeaders, layout })=>{
    const { options } = layout;
    if (!options.reviewWorkflows) {
        return {
            displayedHeaders,
            layout
        };
    }
    return {
        displayedHeaders: [
            ...displayedHeaders,
            ...constants.REVIEW_WORKFLOW_COLUMNS
        ],
        layout
    };
};

exports.addColumnToTableHook = addColumnToTableHook;
//# sourceMappingURL=cm-hooks.js.map
