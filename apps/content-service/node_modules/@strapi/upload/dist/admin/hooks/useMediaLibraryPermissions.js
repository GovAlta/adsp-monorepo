'use strict';

var strapiAdmin = require('@strapi/admin/strapi-admin');
var constants = require('../constants.js');

const { main: _main, ...restPermissions } = constants.PERMISSIONS;
const useMediaLibraryPermissions = ()=>{
    const { allowedActions, isLoading } = strapiAdmin.useRBAC(restPermissions);
    return {
        ...allowedActions,
        isLoading
    };
};

exports.useMediaLibraryPermissions = useMediaLibraryPermissions;
//# sourceMappingURL=useMediaLibraryPermissions.js.map
