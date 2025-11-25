import { mapValues } from 'lodash/fp';
import { PROVIDER_REDIRECT_SUCCESS, PROVIDER_REDIRECT_ERROR } from './constants.mjs';

const PROVIDER_URLS_MAP = {
    success: PROVIDER_REDIRECT_SUCCESS,
    error: PROVIDER_REDIRECT_ERROR
};
const getAdminStore = async ()=>strapi.store({
        type: 'core',
        name: 'admin'
    });
const getPrefixedRedirectUrls = ()=>{
    const { url: adminUrl } = strapi.config.get('admin');
    const prefixUrl = (url)=>`${adminUrl || '/admin'}${url}`;
    return mapValues(prefixUrl, PROVIDER_URLS_MAP);
};
var utils = {
    getAdminStore,
    getPrefixedRedirectUrls
};

export { utils as default, getAdminStore, getPrefixedRedirectUrls };
//# sourceMappingURL=utils.mjs.map
