'use strict';

var draftPublish = require('./draft-publish.js');
var firstPublishedAt = require('./first-published-at.js');
var i18n = require('./i18n.js');

const enable = async ({ oldContentTypes, contentTypes })=>{
    await i18n.enable({
        oldContentTypes,
        contentTypes
    });
    await draftPublish.enable({
        oldContentTypes,
        contentTypes
    });
    await firstPublishedAt.enable({
        oldContentTypes,
        contentTypes
    });
};
const disable = async ({ oldContentTypes, contentTypes })=>{
    await i18n.disable({
        oldContentTypes,
        contentTypes
    });
    await draftPublish.disable({
        oldContentTypes,
        contentTypes
    });
};

exports.disable = disable;
exports.enable = enable;
//# sourceMappingURL=index.js.map
