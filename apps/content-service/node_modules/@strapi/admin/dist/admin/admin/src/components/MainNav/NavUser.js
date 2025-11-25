'use strict';

var jsxRuntime = require('react/jsx-runtime');
var designSystem = require('@strapi/design-system');
var reactIntl = require('react-intl');
var reactRouterDom = require('react-router-dom');
var styled = require('styled-components');
var Auth = require('../../features/Auth.js');
var users = require('../../utils/users.js');

const MenuTrigger = styled.styled(designSystem.Menu.Trigger)`
  padding: 0;

  ${({ theme })=>theme.breakpoints.large} {
    width: 4rem;
    height: 4rem;
    justify-content: center;
  }
`;
const MenuIcon = styled.styled(designSystem.Flex)`
  height: ${({ theme })=>theme.spaces[7]};
  width: ${({ theme })=>theme.spaces[7]};
  border: none;
  border-radius: 50%;
  padding: 0;
  overflow: hidden;
`;
const MenuContent = styled.styled(designSystem.Menu.Content)`
  max-height: fit-content;
  width: 200px;
`;
const UserInfo = styled.styled(designSystem.Flex)`
  && {
    padding: ${({ theme })=>theme.spaces[3]};
  }
  align-items: flex-start;
`;
const BadgeWrapper = styled.styled(designSystem.Flex)`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme })=>theme.spaces[1]};

  width: 100%;
`;
const StyledTypography = styled.styled(designSystem.Typography)`
  word-break: break-word;
  margin-bottom: ${({ theme })=>theme.spaces[3]};
`;
const NavUser = ({ initials, showDisplayName = false, children, ...props })=>{
    const { formatMessage } = reactIntl.useIntl();
    const navigate = reactRouterDom.useNavigate();
    const user = Auth.useAuth('User', (state)=>state.user);
    const logout = Auth.useAuth('Logout', (state)=>state.logout);
    const userDisplayName = users.getDisplayName(user);
    const handleProfile = ()=>{
        const redirection = '/me';
        navigate(redirection);
    };
    const handleLogout = ()=>{
        const redirection = '/auth/login';
        logout();
        navigate(redirection);
    };
    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Flex, {
        ...props,
        children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Menu.Root, {
            children: [
                /*#__PURE__*/ jsxRuntime.jsx(MenuTrigger, {
                    endIcon: null,
                    fullWidth: true,
                    justifyContent: "flex-start",
                    children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                        alignItems: "center",
                        gap: 3,
                        children: [
                            /*#__PURE__*/ jsxRuntime.jsx(MenuIcon, {
                                justifyContent: "center",
                                children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Avatar.Item, {
                                    delayMs: 0,
                                    fallback: initials || users.getInitials(user)
                                })
                            }),
                            showDisplayName ? /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                variant: "omega",
                                children: children || userDisplayName
                            }) : /*#__PURE__*/ jsxRuntime.jsx(designSystem.VisuallyHidden, {
                                tag: "span",
                                children: children || userDisplayName
                            })
                        ]
                    })
                }),
                /*#__PURE__*/ jsxRuntime.jsxs(MenuContent, {
                    popoverPlacement: "top-start",
                    zIndex: 3,
                    children: [
                        /*#__PURE__*/ jsxRuntime.jsxs(UserInfo, {
                            direction: "column",
                            gap: 0,
                            alignItems: "flex-start",
                            children: [
                                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                    variant: "omega",
                                    fontWeight: "bold",
                                    textTransform: "none",
                                    children: children || userDisplayName
                                }),
                                /*#__PURE__*/ jsxRuntime.jsx(StyledTypography, {
                                    variant: "pi",
                                    textColor: "neutral600",
                                    children: user?.email
                                }),
                                /*#__PURE__*/ jsxRuntime.jsx(BadgeWrapper, {
                                    children: user?.roles?.map((role)=>/*#__PURE__*/ jsxRuntime.jsx(designSystem.Badge, {
                                            children: role.name
                                        }, role.id))
                                })
                            ]
                        }),
                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Menu.Separator, {}),
                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Menu.Item, {
                            onSelect: handleProfile,
                            children: formatMessage({
                                id: 'global.profile.settings',
                                defaultMessage: 'Profile settings'
                            })
                        }),
                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Menu.Item, {
                            variant: "danger",
                            onSelect: handleLogout,
                            color: "danger600",
                            children: formatMessage({
                                id: 'app.components.LeftMenu.logout',
                                defaultMessage: 'Log out'
                            })
                        })
                    ]
                })
            ]
        })
    });
};

exports.NavUser = NavUser;
//# sourceMappingURL=NavUser.js.map
