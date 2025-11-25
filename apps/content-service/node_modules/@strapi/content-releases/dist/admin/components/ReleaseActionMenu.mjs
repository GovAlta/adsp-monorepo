import { jsx, jsxs } from 'react/jsx-runtime';
import * as React from 'react';
import { useNotification, useAPIErrorHandler, useRBAC, useAuth, isFetchError } from '@strapi/admin/strapi-admin';
import { Menu, AccessibleIcon } from '@strapi/design-system';
import { Cross, Pencil, More } from '@strapi/icons';
import { useIntl } from 'react-intl';
import { NavLink } from 'react-router-dom';
import { styled } from 'styled-components';
import { PERMISSIONS } from '../constants.mjs';
import { useDeleteReleaseActionMutation } from '../services/release.mjs';

// TODO: has to be fixed in the DS - https://github.com/strapi/design-system/issues/1934
const StyledMenuLink = styled(Menu.Item)`
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
    const { formatMessage } = useIntl();
    const { toggleNotification } = useNotification();
    const { formatAPIError } = useAPIErrorHandler();
    const [deleteReleaseAction] = useDeleteReleaseActionMutation();
    const { allowedActions: { canDeleteAction } } = useRBAC(PERMISSIONS);
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
            if (isFetchError(response.error)) {
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
    return /*#__PURE__*/ jsx(Menu.Item, {
        variant: "danger",
        startIcon: /*#__PURE__*/ jsx(Cross, {}),
        onSelect: handleDeleteAction,
        children: formatMessage({
            id: 'content-releases.content-manager-edit-view.remove-from-release',
            defaultMessage: 'Remove from release'
        })
    });
};
const ReleaseActionEntryLinkItem = ({ contentTypeUid, documentId, locale })=>{
    const { formatMessage } = useIntl();
    const userPermissions = useAuth('ReleaseActionEntryLinkItem', (state)=>state.permissions);
    // Confirm user has permissions to access the entry for the given locale
    const canUpdateEntryForLocale = React.useMemo(()=>{
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
    const { allowedActions: { canUpdate: canUpdateContentType } } = useRBAC({
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
    return /*#__PURE__*/ jsx(StyledMenuLink, {
        /* @ts-expect-error inference isn't working in DS */ tag: NavLink,
        isLink: true,
        to: {
            pathname: `/content-manager/collection-types/${contentTypeUid}/${documentId}`,
            search: locale && `?plugins[i18n][locale]=${locale}`
        },
        startIcon: /*#__PURE__*/ jsx(Pencil, {}),
        children: formatMessage({
            id: 'content-releases.content-manager-edit-view.edit-entry',
            defaultMessage: 'Edit entry'
        })
    });
};
const EditReleaseItem = ({ releaseId })=>{
    const { formatMessage } = useIntl();
    return /*#__PURE__*/ jsx(StyledMenuLink, {
        /* @ts-expect-error inference isn't working in DS */ tag: NavLink,
        isLink: true,
        to: `/plugins/content-releases/${releaseId}`,
        startIcon: /*#__PURE__*/ jsx(Pencil, {}),
        children: formatMessage({
            id: 'content-releases.content-manager-edit-view.edit-release',
            defaultMessage: 'Edit release'
        })
    });
};
const Root = ({ children })=>{
    const { formatMessage } = useIntl();
    const { allowedActions } = useRBAC(PERMISSIONS);
    return(// A user can access the dropdown if they have permissions to delete a release-action OR update a release
    allowedActions.canDeleteAction || allowedActions.canUpdate ? /*#__PURE__*/ jsxs(Menu.Root, {
        children: [
            /*#__PURE__*/ jsx(StyledMoreButton, {
                variant: "tertiary",
                endIcon: null,
                paddingLeft: "7px",
                paddingRight: "7px",
                children: /*#__PURE__*/ jsx(AccessibleIcon, {
                    label: formatMessage({
                        id: 'content-releases.content-manager-edit-view.release-action-menu',
                        defaultMessage: 'Release action options'
                    }),
                    children: /*#__PURE__*/ jsx(More, {})
                })
            }),
            /*#__PURE__*/ jsx(Menu.Content, {
                top: 1,
                popoverPlacement: "bottom-end",
                children: children
            })
        ]
    }) : null);
};
const StyledMoreButton = styled(Menu.Trigger)`
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

export { ReleaseActionMenu };
//# sourceMappingURL=ReleaseActionMenu.mjs.map
