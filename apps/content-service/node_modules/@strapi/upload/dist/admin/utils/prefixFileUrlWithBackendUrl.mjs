const prefixFileUrlWithBackendUrl = (fileURL)=>{
    return !!fileURL && fileURL.startsWith('/') ? `${window.strapi.backendURL}${fileURL}` : fileURL;
};

export { prefixFileUrlWithBackendUrl };
//# sourceMappingURL=prefixFileUrlWithBackendUrl.mjs.map
