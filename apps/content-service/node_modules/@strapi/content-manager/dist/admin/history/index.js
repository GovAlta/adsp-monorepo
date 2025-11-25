'use strict';

var HistoryAction = require('./components/HistoryAction.js');

const historyAdmin = {
    bootstrap (app) {
        const { addDocumentAction } = app.getPlugin('content-manager').apis;
        /**
     * Register the document action here using the public API, and not by setting the action in the
     * Content Manager directly, because this API lets us control the order of the actions array.
     * We want history to be the last non-delete action in the array.
     */ addDocumentAction((actions)=>{
            const indexOfDeleteAction = actions.findIndex((action)=>action.type === 'delete');
            actions.splice(indexOfDeleteAction, 0, HistoryAction.HistoryAction);
            return actions;
        });
    }
};

exports.historyAdmin = historyAdmin;
//# sourceMappingURL=index.js.map
