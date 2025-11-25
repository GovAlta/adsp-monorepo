import { jsx, Fragment } from 'react/jsx-runtime';
import * as React from 'react';
import { Main, Flex, Loader, EmptyStateLayout, Box } from '@strapi/design-system';
import { WarningCircle } from '@strapi/icons';
import { EmptyPermissions, EmptyDocuments } from '@strapi/icons/symbols';
import { useIntl } from 'react-intl';
import { useAuth } from '../features/Auth.mjs';
import { useNotification } from '../features/Notifications.mjs';
import { useAPIErrorHandler } from '../hooks/useAPIErrorHandler.mjs';
import { useCheckPermissionsQuery } from '../services/auth.mjs';

const PageMain = ({ children, ...restProps })=>{
    return /*#__PURE__*/ jsx(Main, {
        ...restProps,
        children: children
    });
};
/**
 * @public
 * @description A loading component that should be rendered as the page
 * whilst you load the content for the aforementioned page.
 */ const Loading = ({ children = 'Loading content.' })=>{
    return /*#__PURE__*/ jsx(PageMain, {
        height: "100dvh",
        "aria-busy": true,
        children: /*#__PURE__*/ jsx(Flex, {
            alignItems: "center",
            height: "100%",
            justifyContent: "center",
            children: /*#__PURE__*/ jsx(Loader, {
                children: children
            })
        })
    });
};
/**
 * TODO: should we start passing our errors here so they're persisted on the screen?
 * This could follow something similar to how the global app error works...?
 */ /**
 * @public
 * @description An error component that should be rendered as the page
 * when an error occurs.
 */ const Error = (props)=>{
    const { formatMessage } = useIntl();
    return /*#__PURE__*/ jsx(PageMain, {
        height: "100%",
        children: /*#__PURE__*/ jsx(Flex, {
            alignItems: "center",
            height: "100%",
            justifyContent: "center",
            children: /*#__PURE__*/ jsx(EmptyStateLayout, {
                icon: /*#__PURE__*/ jsx(WarningCircle, {
                    width: "16rem"
                }),
                content: formatMessage({
                    id: 'anErrorOccurred',
                    defaultMessage: 'Whoops! Something went wrong. Please, try again.'
                }),
                ...props
            })
        })
    });
};
/**
 * @public
 * @description A component that should be rendered as the page
 * when the user does not have the permissions to access the content.
 * This component does not check any permissions, it's up to you to decide
 * when it should be rendered.
 */ const NoPermissions = (props)=>{
    const { formatMessage } = useIntl();
    return /*#__PURE__*/ jsx(PageMain, {
        height: "100%",
        children: /*#__PURE__*/ jsx(Flex, {
            alignItems: "center",
            height: "100%",
            justifyContent: "center",
            children: /*#__PURE__*/ jsx(Box, {
                minWidth: "50%",
                children: /*#__PURE__*/ jsx(EmptyStateLayout, {
                    icon: /*#__PURE__*/ jsx(EmptyPermissions, {
                        width: "16rem"
                    }),
                    content: formatMessage({
                        id: 'app.components.EmptyStateLayout.content-permissions',
                        defaultMessage: "You don't have the permissions to access that content"
                    }),
                    ...props
                })
            })
        })
    });
};
/**
 * @public
 * @description A component that should be rendered as the page
 * when there is no data available to display.
 * This component does not check any permissions, it's up to you to decide
 * when it should be rendered.
 */ const NoData = (props)=>{
    const { formatMessage } = useIntl();
    return /*#__PURE__*/ jsx(PageMain, {
        height: "100%",
        background: "neutral100",
        children: /*#__PURE__*/ jsx(Flex, {
            alignItems: "center",
            height: "100%",
            width: "100%",
            justifyContent: "center",
            children: /*#__PURE__*/ jsx(Box, {
                minWidth: "50%",
                children: /*#__PURE__*/ jsx(EmptyStateLayout, {
                    icon: /*#__PURE__*/ jsx(EmptyDocuments, {
                        width: "16rem"
                    }),
                    action: props.action,
                    content: formatMessage({
                        id: 'app.components.EmptyStateLayout.content-document',
                        defaultMessage: 'No content found'
                    }),
                    ...props
                })
            })
        })
    });
};
/**
 * @public
 * @description A wrapper component that should be used to protect a page. It will check the permissions
 * you pass to it and render the children if the user has the required permissions. If a user does not have ALL
 * the required permissions, it will redirect the user to the home page. Whilst these checks happen it will render
 * the loading component and should the check fail it will render the error component with a notification.
 */ const Protect = ({ permissions = [], children })=>{
    const userPermissions = useAuth('Protect', (state)=>state.permissions);
    const { toggleNotification } = useNotification();
    const { _unstableFormatAPIError: formatAPIError } = useAPIErrorHandler();
    const matchingPermissions = userPermissions.filter((permission)=>permissions.findIndex((perm)=>perm.action === permission.action && perm.subject === permission.subject) >= 0);
    const shouldCheckConditions = matchingPermissions.some((perm)=>Array.isArray(perm.conditions) && perm.conditions.length > 0);
    const { isLoading, error, data } = useCheckPermissionsQuery({
        permissions: matchingPermissions.map((perm)=>({
                action: perm.action,
                subject: perm.subject
            }))
    }, {
        skip: !shouldCheckConditions
    });
    React.useEffect(()=>{
        if (error) {
            toggleNotification({
                type: 'danger',
                message: formatAPIError(error)
            });
        }
    }, [
        error,
        formatAPIError,
        toggleNotification
    ]);
    if (isLoading) {
        return /*#__PURE__*/ jsx(Loading, {});
    }
    if (error) {
        return /*#__PURE__*/ jsx(Error, {});
    }
    const { data: permissionsData } = data || {};
    const canAccess = shouldCheckConditions && permissionsData ? !permissionsData.includes(false) : matchingPermissions.length > 0;
    if (!canAccess) {
        return /*#__PURE__*/ jsx(NoPermissions, {});
    }
    return /*#__PURE__*/ jsx(Fragment, {
        children: typeof children === 'function' ? children({
            permissions: matchingPermissions
        }) : children
    });
};
/**
 * @public
 * @description This component takes the children (must be a string) and sets
 * it as the title of the html.
 */ const Title = ({ children: title })=>{
    React.useEffect(()=>{
        document.title = `${title} | Strapi`;
    }, [
        title
    ]);
    return null;
};
const Page = {
    Error,
    Loading,
    NoPermissions,
    Protect,
    NoData,
    Main: PageMain,
    Title
};

export { Page };
//# sourceMappingURL=PageHelpers.mjs.map
