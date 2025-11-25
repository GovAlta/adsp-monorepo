'use strict';

var utils = require('@strapi/utils');
var index = require('../../utils/index.js');

/**
 * A valid transfer token salt must be a non-empty string defined in the Strapi config
 */ const hasValidTokenSalt = ()=>{
    const salt = strapi.config.get('admin.transfer.token.salt', null);
    return typeof salt === 'string' && salt.length > 0;
};
/**
 * Checks whether data transfer features are enabled
 */ const isRemoteTransferEnabled = ()=>{
    const { utils: utils$1 } = index.getService('transfer');
    // TODO v6: Remove this warning
    if (utils.env.bool('STRAPI_DISABLE_REMOTE_DATA_TRANSFER') !== undefined) {
        strapi.log.warn('STRAPI_DISABLE_REMOTE_DATA_TRANSFER is no longer supported. Instead, set transfer.remote.enabled to false in your server configuration');
    }
    return utils$1.hasValidTokenSalt() && strapi.config.get('server.transfer.remote.enabled');
};

exports.hasValidTokenSalt = hasValidTokenSalt;
exports.isRemoteTransferEnabled = isRemoteTransferEnabled;
//# sourceMappingURL=utils.js.map
