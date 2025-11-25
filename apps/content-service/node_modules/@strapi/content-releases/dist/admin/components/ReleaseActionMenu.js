'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var strapiAdmin = require('@strapi/admin/strapi-admin');
var designSystem = require('@strapi/design-system');
var icons = require('@strapi/icons');
var reactIntl = require('react-intl');
var reactRouterDom = require('react-router-dom');
var styledComponents = require('styled-components');
var constants = require('../constants.js');
var release = require('../services/release.js');

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

// TODO: has to be fixed in the DS - https://github.com/strapi/design-system/issues/1934
const StyledMenuLink = styledComponents.styled(designSystem.Menu.Item)`
  span,
  &:hover span {
    color: ${({ theme })=>theme.colors['neutral800']};
  }

  svg path,
  &:hover svg path {
    fill: ${({ theme })=>theme.colors['neutral500']};
  }
`;
const DeleteReleaseActionItem = ({ releaseId, actionId })=>{
    const { formatMessage } = reactIntl.useIntl();
    const { toggleNotification } = strapiAdmin.useNotification();
    const { formatAPIError } = strapiAdmin.useAPIErrorHandler();
    const [deleteReleaseAction] = release.useDeleteReleaseActionMutation();
    const { allowedActions: { canDeleteAction } } = strapiAdmin.useRBAC(constants.PERMISSIONS);
    const handleDeleteAction = async ()=>{
        const response = await deleteReleaseAction({
            params: {
                releaseId,
                actionId
            }
        });
        if ('data' in response) {
            // Handle success
            toggleNotification({
                type: 'success',
                message: formatMessage({
                    id: 'content-releases.content-manager-edit-view.remove-from-release.notification.success',
                    defaultMessage: 'Entry removed from release'
                })
            });
            return;
        }
        if ('error' in response) {
            if (strapiAdmin.isFetchError(response.error)) {
                // Handle fetch error
                toggleNotification({
                    type: 'danger',
                    message: formatAPIError(response.error)
                });
            } else {
                // Handle generic error
                toggleNotification({
                    type: 'danger',
                    message: formatMessage({
                        id: 'notification.error',
                        defaultMessage: 'An error occurred'
                    })
                });
            }
        }
    };
    if (!canDeleteAction) {
        return null;
    }
    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Menu.Item, {
        variant: "danger",
        startIcon: /*#__PURE__*/ jsxRuntime.jsx(icons.Cross, {}),
        onSelect: handleDeleteAction,
        children: formatMessage({
            id: 'content-releases.content-manager-edit-view.remove-from-release',
            defaultMessage: 'Remove from release'
        })
    });
};
const ReleaseActionEntryLinkItem = ({ contentTypeUid, documentId, locale })=>{
    const { formatMessage } = reactIntl.useIntl();
    const userPermissions = strapiAdmin.useAuth('ReleaseActionEntryLinkItem', (state)=>state.permissions);
    // Confirm user has permissions to access the entry for the given locale
    const canUpdateEntryForLocale = React__namespace.useMemo(()=>{
        const updatePermissions = userPermissions.find((permission)=>permission.subject === contentTypeUid && permission.action === 'plugin::content-manager.explorer.update');
        if (!updatePermissions) {
            return false;
        }
        return Boolean(!locale || updatePermissions.properties?.locales?.includes(locale));
    }, [
        contentTypeUid,
        locale,
        userPermissions
    ]);
    const { allowedActions: { canUpdate: canUpdateContentType } } = strapiAdmin.useRBAC({
        updateContentType: [
            {
                action: 'plugin::content-manager.explorer.update',
                subject: contentTypeUid
            }
        ]
    });
    if (!canUpdateContentType || !canUpdateEntryForLocale) {
        return null;
    }
    return /*#__PURE__*/ jsxRuntime.jsx(StyledMenuLink, {
        /* @ts-expect-error inference isn't working in DS */ tag: reactRouterDom.NavLink,
        isLink: true,
        to: {
            pathname: `/content-manager/collection-types/${contentTypeUid}/${documentId}`,
            search: locale && `?plugins[i18n][locale]=${locale}`
        },
        startIcon: /*#__PURE__*/ jsxRuntime.jsx(icons.Pencil, {}),
        children: formatMessage({
            id: 'content-releases.content-manager-edit-view.edit-entry',
            defaultMessage: 'Edit entry'
        })
    });
};
const EditReleaseItem = ({ releaseId })=>{
    const { formatMessage } = reactIntl.useIntl();
    return /*#__PURE__*/ jsxRuntime.jsx(StyledMenuLink, {
        /* @ts-expect-error inference isn't working in DS */ tag: reactRouterDom.NavLink,
        isLink: true,
        to: `/plugins/content-releases/${releaseId}`,
        startIcon: /*#__PURE__*/ jsxRuntime.jsx(icons.Pencil, {}),
        children: formatMessage({
            id: 'content-releases.content-manager-edit-view.edit-release',
            defaultMessage: 'Edit release'
        })
    });
};
const Root = ({ children })=>{
    const { formatMessage } = reactIntl.useIntl();
    const { allowedActions } = strapiAdmin.useRBAC(constants.PERMISSIONS);
    return(// A user can access the dropdown if they have permissions to delete a release-action OR update a release
    allowedActions.canDeleteAction || allowedActions.canUpdate ? /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Menu.Root, {
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(StyledMoreButton, {
                variant: "tertiary",
                endIcon: null,
                paddingLeft: "7px",
                paddingRight: "7px",
                children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.AccessibleIcon, {
                    label: formatMessage({
                        id: 'content-releases.content-manager-edit-view.release-action-menu',
                        defaultMessage: 'Release action options'
                    }),
                    children: /*#__PURE__*/ jsxRuntime.jsx(icons.More, {})
                })
            }),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Menu.Content, {
                top: 1,
                popoverPlacement: "bottom-end",
                children: children
            })
        ]
    }) : null);
};
const StyledMoreButton = styledComponents.styled(designSystem.Menu.Trigger)`
  & > span {
    display: flex;
  }
`;
const ReleaseActionMenu = {
    Root,
    EditReleaseItem,
    DeleteReleaseActionItem,
    ReleaseActionEntryLinkItem
};

exports.ReleaseActionMenu = ReleaseActionMenu;
//# sourceMappingURL=ReleaseActionMenu.js.map
