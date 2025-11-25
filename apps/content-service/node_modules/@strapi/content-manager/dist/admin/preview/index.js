'use strict';

var PreviewSidePanel = require('./components/PreviewSidePanel.js');

const previewAdmin = {
    bootstrap (app) {
        const contentManagerPluginApis = app.getPlugin('content-manager').apis;
        contentManagerPluginApis.addEditViewSidePanel([
            PreviewSidePanel.PreviewSidePanel
        ]);
    }
};

exports.previewAdmin = previewAdmin;
//# sourceMappingURL=index.js.map
