'use strict';

var React = require('react');
var isEqual = require('lodash/isEqual');
var Auth = require('../features/Auth.js');
var once = require('../utils/once.js');
var strings = require('../utils/strings.js');
var usePrev = require('./usePrev.js');

function _interopNamespaceDefault(e) {
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  }
  n.default = e;
  return Object.freeze(n);
}

var React__namespace = /*#__PURE__*/_interopNamespaceDefault(React);

/**
 * @public
 * @description This hooks takes an object or array of permissions (the latter preferred) and
 * runs through them to match against the current user's permissions as well as the RBAC middleware
 * system checking any conditions that may be present. It returns the filtered permissions as the complete
 * object from the API and a set of actions that can be performed. An action is derived from the last part
 * of the permission action e.g. `admin::roles.create` would be `canCreate`. If there's a hyphen in the action
 * this is removed and capitalised e.g `admin::roles.create-draft` would be `canCreateDraft`.
 * @example
 * ```tsx
 * import { Page, useRBAC } from '@strapi/strapi/admin'
 *
 * const MyProtectedPage = () => {
 *  const { allowedActions, isLoading, error, permissions } = useRBAC([{ action: 'admin::roles.create' }])
 *
 *  if(isLoading) {
 *    return <Page.Loading />
 *  }
 *
 *  if(error){
 *    return <Page.Error />
 *  }
 *
 *  if(!allowedActions.canCreate) {
 *    return null
 *  }
 *
 *  return <MyPage permissions={permissions} />
 * }
 * ```
 */ const useRBAC = (permissionsToCheck = [], passedPermissions, rawQueryContext)=>{
    const isLoadingAuth = Auth.useAuth('useRBAC', (state)=>state.isLoading);
    const [isLoading, setIsLoading] = React__namespace.useState(true);
    const [error, setError] = React__namespace.useState();
    const [data, setData] = React__namespace.useState();
    const warnOnce = React__namespace.useMemo(()=>once.once(console.warn), []);
    const actualPermissionsToCheck = React__namespace.useMemo(()=>{
        if (Array.isArray(permissionsToCheck)) {
            return permissionsToCheck;
        } else {
            warnOnce('useRBAC: The first argument should be an array of permissions, not an object. This will be deprecated in the future.');
            return Object.values(permissionsToCheck).flat();
        }
    }, [
        permissionsToCheck,
        warnOnce
    ]);
    /**
   * This is the default value we return until the queryResults[i].data
   * are all resolved with data. This preserves the original behaviour.
   */ const defaultAllowedActions = React__namespace.useMemo(()=>{
        return actualPermissionsToCheck.reduce((acc, permission)=>{
            return {
                ...acc,
                [getActionName(permission)]: false
            };
        }, {});
    }, [
        actualPermissionsToCheck
    ]);
    const checkUserHasPermissions = Auth.useAuth('useRBAC', (state)=>state.checkUserHasPermissions);
    const permssionsChecked = usePrev.usePrev(actualPermissionsToCheck);
    const contextChecked = usePrev.usePrev(rawQueryContext);
    React__namespace.useEffect(()=>{
        if (!isEqual(permssionsChecked, actualPermissionsToCheck) || // TODO: also run this when the query context changes
        contextChecked !== rawQueryContext) {
            setIsLoading(true);
            setData(undefined);
            setError(undefined);
            checkUserHasPermissions(actualPermissionsToCheck, passedPermissions, rawQueryContext).then((res)=>{
                if (res) {
                    setData(res.reduce((acc, permission)=>{
                        return {
                            ...acc,
                            [getActionName(permission)]: true
                        };
                    }, {}));
                }
            }).catch((err)=>{
                setError(err);
            }).finally(()=>{
                setIsLoading(false);
            });
        }
    }, [
        actualPermissionsToCheck,
        checkUserHasPermissions,
        passedPermissions,
        permissionsToCheck,
        permssionsChecked,
        contextChecked,
        rawQueryContext
    ]);
    /**
   * This hook originally would not return allowedActions
   * until all the checks were complete.
   */ const allowedActions = Object.entries({
        ...defaultAllowedActions,
        ...data
    }).reduce((acc, [name, allowed])=>{
        acc[`can${strings.capitalise(name)}`] = allowed;
        return acc;
    }, {});
    return {
        allowedActions,
        permissions: actualPermissionsToCheck,
        isLoading: isLoading || isLoadingAuth,
        error
    };
};
const getActionName = (permission)=>{
    const [action = ''] = permission.action.split('.').slice(-1);
    return action.split('-').map(strings.capitalise).join('');
};

exports.useRBAC = useRBAC;
//# sourceMappingURL=useRBAC.js.map
