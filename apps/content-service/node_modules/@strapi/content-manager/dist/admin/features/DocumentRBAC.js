'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var strapiAdmin = require('@strapi/admin/strapi-admin');
var reactRouterDom = require('react-router-dom');

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

const [DocumentRBACProvider, useDocumentRBAC] = strapiAdmin.createContext('DocumentRBAC', {
    canCreate: false,
    canCreateFields: [],
    canDelete: false,
    canPublish: false,
    canRead: false,
    canReadFields: [],
    canUpdate: false,
    canUpdateFields: [],
    canUserAction: ()=>false,
    isLoading: false
});
/**
 * @internal This component is not meant to be used outside of the Content Manager plugin.
 * It depends on knowing the slug/model of the content-type using the params of the URL or the model if it is passed as arg.
 * If you do use the hook outside of the context, we default to `false` for all actions.
 *
 * It then creates an list of `can{Action}` that are passed to the context for consumption
 * within the app to enforce RBAC.
 */ const DocumentRBAC = ({ children, permissions, model })=>{
    const { slug } = reactRouterDom.useParams();
    if (!slug && !model) {
        throw new Error('Cannot find the slug param in the URL or the model prop is not provided.');
    }
    const contentTypeUid = model ?? slug;
    const [{ rawQuery }] = strapiAdmin.useQueryParams();
    const userPermissions = strapiAdmin.useAuth('DocumentRBAC', (state)=>state.permissions);
    const contentTypePermissions = React__namespace.useMemo(()=>{
        const contentTypePermissions = userPermissions.filter((permission)=>permission.subject === contentTypeUid);
        return contentTypePermissions.reduce((acc, permission)=>{
            const [action] = permission.action.split('.').slice(-1);
            return {
                ...acc,
                [action]: [
                    permission
                ]
            };
        }, {});
    }, [
        contentTypeUid,
        userPermissions
    ]);
    const { isLoading, allowedActions } = strapiAdmin.useRBAC(contentTypePermissions, permissions ?? undefined, // TODO: useRBAC context should be typed and built differently
    // We are passing raw query as context to the hook so that it can
    // rely on the locale provided from DocumentRBAC for its permission calculations.
    rawQuery);
    const canCreateFields = !isLoading && allowedActions.canCreate ? extractAndDedupeFields(contentTypePermissions.create) : [];
    const canReadFields = !isLoading && allowedActions.canRead ? extractAndDedupeFields(contentTypePermissions.read) : [];
    const canUpdateFields = !isLoading && allowedActions.canUpdate ? extractAndDedupeFields(contentTypePermissions.update) : [];
    /**
   * @description Checks if the user can perform an action on a field based on the field names
   * provided as the second argument.
   */ const canUserAction = React__namespace.useCallback((fieldName, fieldsUserCanAction, fieldType)=>{
        const name = removeNumericalStrings(fieldName.split('.'));
        const componentFieldNames = fieldsUserCanAction// filter out fields that aren't components (components are dot separated)
        .filter((field)=>field.split('.').length > 1);
        if (fieldType === 'component') {
            // check if the field name is within any of those arrays
            return componentFieldNames.some((field)=>{
                return field.includes(name.join('.'));
            });
        }
        /**
       * The field is within a component.
       */ if (name.length > 1) {
            return componentFieldNames.includes(name.join('.'));
        }
        /**
       * just a regular field
       */ return fieldsUserCanAction.includes(fieldName);
    }, []);
    if (isLoading) {
        return /*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.Page.Loading, {});
    }
    return /*#__PURE__*/ jsxRuntime.jsx(DocumentRBACProvider, {
        isLoading: isLoading,
        canCreateFields: canCreateFields,
        canReadFields: canReadFields,
        canUpdateFields: canUpdateFields,
        canUserAction: canUserAction,
        ...allowedActions,
        children: children
    });
};
/**
 * @internal it's really small, but it's used three times in a row and DRY for something this straight forward.
 */ const extractAndDedupeFields = (permissions = [])=>permissions.flatMap((permission)=>permission.properties?.fields).filter((field, index, arr)=>arr.indexOf(field) === index && typeof field === 'string');
/**
 * @internal removes numerical strings from arrays.
 * @example
 * ```ts
 * const name = 'a.0.b';
 * const res = removeNumericalStrings(name.split('.'));
 * console.log(res); // ['a', 'b']
 * ```
 */ const removeNumericalStrings = (arr)=>arr.filter((item)=>isNaN(Number(item)));

exports.DocumentRBAC = DocumentRBAC;
exports.useDocumentRBAC = useDocumentRBAC;
//# sourceMappingURL=DocumentRBAC.js.map
