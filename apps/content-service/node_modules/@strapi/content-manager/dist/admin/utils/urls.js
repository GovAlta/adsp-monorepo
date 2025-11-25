'use strict';

const prefixFileUrlWithBackendUrl = (fileURL)=>{
    return !!fileURL && fileURL.startsWith('/') ? `${window.strapi.backendURL}${fileURL}` : fileURL;
};

exports.prefixFileUrlWithBackendUrl = prefixFileUrlWithBackendUrl;
//# sourceMappingURL=urls.js.map
