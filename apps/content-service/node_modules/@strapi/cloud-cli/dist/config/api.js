'use strict';

var utils = require('@strapi/utils');

const apiConfig = {
    apiBaseUrl: utils.env('STRAPI_CLI_CLOUD_API', 'https://cloud-cli-api.strapi.io'),
    dashboardBaseUrl: utils.env('STRAPI_CLI_CLOUD_DASHBOARD', 'https://cloud.strapi.io')
};

exports.apiConfig = apiConfig;
//# sourceMappingURL=api.js.map
