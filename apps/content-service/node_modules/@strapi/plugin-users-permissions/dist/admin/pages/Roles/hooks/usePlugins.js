'use strict';

var React = require('react');
var admin = require('@strapi/strapi/admin');
var reactQuery = require('react-query');
var cleanPermissions = require('../../../utils/cleanPermissions.js');
var getTrad = require('../../../utils/getTrad.js');

const usePlugins = ()=>{
    const { toggleNotification } = admin.useNotification();
    const { get } = admin.useFetchClient();
    const { formatAPIError } = admin.useAPIErrorHandler(getTrad);
    const [{ data: permissions, isLoading: isLoadingPermissions, error: permissionsError, refetch: refetchPermissions }, { data: routes, isLoading: isLoadingRoutes, error: routesError, refetch: refetchRoutes }] = reactQuery.useQueries([
        {
            queryKey: [
                'users-permissions',
                'permissions'
            ],
            async queryFn () {
                const { data: { permissions } } = await get(`/users-permissions/permissions`);
                return permissions;
            }
        },
        {
            queryKey: [
                'users-permissions',
                'routes'
            ],
            async queryFn () {
                const { data: { routes } } = await get(`/users-permissions/routes`);
                return routes;
            }
        }
    ]);
    const refetchQueries = async ()=>{
        await Promise.all([
            refetchPermissions(),
            refetchRoutes()
        ]);
    };
    React.useEffect(()=>{
        if (permissionsError) {
            toggleNotification({
                type: 'danger',
                message: formatAPIError(permissionsError)
            });
        }
    }, [
        toggleNotification,
        permissionsError,
        formatAPIError
    ]);
    React.useEffect(()=>{
        if (routesError) {
            toggleNotification({
                type: 'danger',
                message: formatAPIError(routesError)
            });
        }
    }, [
        toggleNotification,
        routesError,
        formatAPIError
    ]);
    const isLoading = isLoadingPermissions || isLoadingRoutes;
    return {
        // TODO: these return values need to be memoized, otherwise
        // they will create infinite rendering loops when used as
        // effect dependencies
        permissions: permissions ? cleanPermissions(permissions) : {},
        routes: routes ?? {},
        getData: refetchQueries,
        isLoading
    };
};

exports.usePlugins = usePlugins;
//# sourceMappingURL=usePlugins.js.map
