import { jsx, jsxs } from 'react/jsx-runtime';
import { Menu, Flex, Typography, Avatar, VisuallyHidden, Badge } from '@strapi/design-system';
import { useIntl } from 'react-intl';
import { useNavigate } from 'react-router-dom';
import { styled } from 'styled-components';
import { useAuth } from '../../features/Auth.mjs';
import { getInitials, getDisplayName } from '../../utils/users.mjs';

const MenuTrigger = styled(Menu.Trigger)`
  padding: 0;

  ${({ theme })=>theme.breakpoints.large} {
    width: 4rem;
    height: 4rem;
    justify-content: center;
  }
`;
const MenuIcon = styled(Flex)`
  height: ${({ theme })=>theme.spaces[7]};
  width: ${({ theme })=>theme.spaces[7]};
  border: none;
  border-radius: 50%;
  padding: 0;
  overflow: hidden;
`;
const MenuContent = styled(Menu.Content)`
  max-height: fit-content;
  width: 200px;
`;
const UserInfo = styled(Flex)`
  && {
    padding: ${({ theme })=>theme.spaces[3]};
  }
  align-items: flex-start;
`;
const BadgeWrapper = styled(Flex)`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme })=>theme.spaces[1]};

  width: 100%;
`;
const StyledTypography = styled(Typography)`
  word-break: break-word;
  margin-bottom: ${({ theme })=>theme.spaces[3]};
`;
const NavUser = ({ initials, showDisplayName = false, children, ...props })=>{
    const { formatMessage } = useIntl();
    const navigate = useNavigate();
    const user = useAuth('User', (state)=>state.user);
    const logout = useAuth('Logout', (state)=>state.logout);
    const userDisplayName = getDisplayName(user);
    const handleProfile = ()=>{
        const redirection = '/me';
        navigate(redirection);
    };
    const handleLogout = ()=>{
        const redirection = '/auth/login';
        logout();
        navigate(redirection);
    };
    return /*#__PURE__*/ jsx(Flex, {
        ...props,
        children: /*#__PURE__*/ jsxs(Menu.Root, {
            children: [
                /*#__PURE__*/ jsx(MenuTrigger, {
                    endIcon: null,
                    fullWidth: true,
                    justifyContent: "flex-start",
                    children: /*#__PURE__*/ jsxs(Flex, {
                        alignItems: "center",
                        gap: 3,
                        children: [
                            /*#__PURE__*/ jsx(MenuIcon, {
                                justifyContent: "center",
                                children: /*#__PURE__*/ jsx(Avatar.Item, {
                                    delayMs: 0,
                                    fallback: initials || getInitials(user)
                                })
                            }),
                            showDisplayName ? /*#__PURE__*/ jsx(Typography, {
                                variant: "omega",
                                children: children || userDisplayName
                            }) : /*#__PURE__*/ jsx(VisuallyHidden, {
                                tag: "span",
                                children: children || userDisplayName
                            })
                        ]
                    })
                }),
                /*#__PURE__*/ jsxs(MenuContent, {
                    popoverPlacement: "top-start",
                    zIndex: 3,
                    children: [
                        /*#__PURE__*/ jsxs(UserInfo, {
                            direction: "column",
                            gap: 0,
                            alignItems: "flex-start",
                            children: [
                                /*#__PURE__*/ jsx(Typography, {
                                    variant: "omega",
                                    fontWeight: "bold",
                                    textTransform: "none",
                                    children: children || userDisplayName
                                }),
                                /*#__PURE__*/ jsx(StyledTypography, {
                                    variant: "pi",
                                    textColor: "neutral600",
                                    children: user?.email
                                }),
                                /*#__PURE__*/ jsx(BadgeWrapper, {
                                    children: user?.roles?.map((role)=>/*#__PURE__*/ jsx(Badge, {
                                            children: role.name
                                        }, role.id))
                                })
                            ]
                        }),
                        /*#__PURE__*/ jsx(Menu.Separator, {}),
                        /*#__PURE__*/ jsx(Menu.Item, {
                            onSelect: handleProfile,
                            children: formatMessage({
                                id: 'global.profile.settings',
                                defaultMessage: 'Profile settings'
                            })
                        }),
                        /*#__PURE__*/ jsx(Menu.Item, {
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

export { NavUser };
//# sourceMappingURL=NavUser.mjs.map
