'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var fp = require('lodash/fp');
var constants = require('./constants.js');

const PROVIDER_URLS_MAP = {
    success: constants.PROVIDER_REDIRECT_SUCCESS,
    error: constants.PROVIDER_REDIRECT_ERROR
};
const getAdminStore = async ()=>strapi.store({
        type: 'core',
        name: 'admin'
    });
const getPrefixedRedirectUrls = ()=>{
    const { url: adminUrl } = strapi.config.get('admin');
    const prefixUrl = (url)=>`${adminUrl || '/admin'}${url}`;
    return fp.mapValues(prefixUrl, PROVIDER_URLS_MAP);
};
var utils = {
    getAdminStore,
    getPrefixedRedirectUrls
};

exports.default = utils;
exports.getAdminStore = getAdminStore;
exports.getPrefixedRedirectUrls = getPrefixedRedirectUrls;
//# sourceMappingURL=utils.js.map
