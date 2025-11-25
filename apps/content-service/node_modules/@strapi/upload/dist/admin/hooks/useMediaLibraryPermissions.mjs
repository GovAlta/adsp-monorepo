import { useRBAC } from '@strapi/admin/strapi-admin';
import { PERMISSIONS } from '../constants.mjs';

const { main: _main, ...restPermissions } = PERMISSIONS;
const useMediaLibraryPermissions = ()=>{
    const { allowedActions, isLoading } = useRBAC(restPermissions);
    return {
        ...allowedActions,
        isLoading
    };
};

export { useMediaLibraryPermissions };
//# sourceMappingURL=useMediaLibraryPermissions.mjs.map
