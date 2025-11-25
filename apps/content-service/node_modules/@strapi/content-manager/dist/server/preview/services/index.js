'use strict';

var preview = require('./preview.js');
var previewConfig = require('./preview-config.js');

const services = {
    preview: preview.createPreviewService,
    'preview-config': previewConfig.createPreviewConfigService
};

exports.services = services;
//# sourceMappingURL=index.js.map
