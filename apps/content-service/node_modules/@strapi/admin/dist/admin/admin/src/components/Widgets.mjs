import { jsxs, jsx } from 'react/jsx-runtime';
import { useAuth, useTracking } from '@strapi/admin/strapi-admin';
import { Typography, Flex, Avatar, Badge, Box } from '@strapi/design-system';
import { Files, Images, Layout, Graph, Earth, User, Webhooks, Key } from '@strapi/icons';
import { useIntl } from 'react-intl';
import { Link } from 'react-router-dom';
import { styled } from 'styled-components';
import { useGetCountDocumentsQuery, useGetKeyStatisticsQuery } from '../services/homepage.mjs';
import { getInitials, getDisplayName } from '../utils/users.mjs';
import { Widget } from './WidgetHelpers.mjs';

/* -------------------------------------------------------------------------------------------------
 * ProfileWidget
 * -----------------------------------------------------------------------------------------------*/ const DisplayNameTypography = styled(Typography)`
  font-size: 2.4rem;
`;
const ProfileWidget = ()=>{
    const user = useAuth('User', (state)=>state.user);
    const userDisplayName = getDisplayName(user);
    const initials = getInitials(user);
    return /*#__PURE__*/ jsxs(Flex, {
        direction: "column",
        gap: 3,
        height: "100%",
        justifyContent: "center",
        children: [
            /*#__PURE__*/ jsx(Avatar.Item, {
                delayMs: 0,
                fallback: initials
            }),
            userDisplayName && /*#__PURE__*/ jsx(DisplayNameTypography, {
                fontWeight: "bold",
                textTransform: "none",
                textAlign: "center",
                children: userDisplayName
            }),
            user?.email && /*#__PURE__*/ jsx(Typography, {
                variant: "omega",
                textColor: "neutral600",
                children: user?.email
            }),
            user?.roles?.length && /*#__PURE__*/ jsx(Flex, {
                marginTop: 2,
                gap: 1,
                wrap: "wrap",
                children: user?.roles?.map((role)=>/*#__PURE__*/ jsx(Badge, {
                        children: role.name
                    }, role.id))
            })
        ]
    });
};
/* -------------------------------------------------------------------------------------------------
 * Key Statistics
 * -----------------------------------------------------------------------------------------------*/ const Grid = styled(Box)`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
  border: 1px solid ${({ theme })=>theme.colors.neutral200};
  border-radius: ${({ theme })=>theme.borderRadius};
  overflow: hidden;
`;
const GridCell = styled(Box)`
  border-bottom: 1px solid ${({ theme })=>theme.colors.neutral200};
  border-right: 1px solid ${({ theme })=>theme.colors.neutral200};
  display: flex;
  flex-direction: row;
  align-items: flex-start;

  &:nth-child(2n) {
    border-right: none;
  }
  &:nth-last-child(-n + 2) {
    border-bottom: none;
  }
`;
const formatNumber = ({ locale, number })=>{
    return new Intl.NumberFormat(locale, {
        notation: 'compact',
        maximumFractionDigits: 1
    }).format(number);
};
const LinkCell = styled(Link)`
  text-decoration: none;
  padding: ${({ theme })=>theme.spaces[3]};
`;
const KeyStatisticsWidget = ()=>{
    const { trackUsage } = useTracking();
    const { formatMessage, locale } = useIntl();
    const { data: countDocuments, isLoading: isLoadingCountDocuments } = useGetCountDocumentsQuery();
    const { data: countKeyStatistics, isLoading: isLoadingKeyStatistics } = useGetKeyStatisticsQuery();
    if (isLoadingKeyStatistics || isLoadingCountDocuments) {
        return /*#__PURE__*/ jsx(Widget.Loading, {});
    }
    if (!countKeyStatistics || !countDocuments) {
        return /*#__PURE__*/ jsx(Widget.Error, {});
    }
    const keyStatisticsList = {
        entries: {
            label: {
                id: 'widget.key-statistics.list.entries',
                defaultMessage: 'Entries'
            },
            icon: {
                component: /*#__PURE__*/ jsx(Files, {}),
                background: 'primary100',
                color: 'primary600'
            },
            link: '/content-manager'
        },
        assets: {
            label: {
                id: 'widget.key-statistics.list.assets',
                defaultMessage: 'Assets'
            },
            icon: {
                component: /*#__PURE__*/ jsx(Images, {}),
                background: 'warning100',
                color: 'warning600'
            },
            link: '/plugins/upload'
        },
        contentTypes: {
            label: {
                id: 'widget.key-statistics.list.contentTypes',
                defaultMessage: 'Content-Types'
            },
            icon: {
                component: /*#__PURE__*/ jsx(Layout, {}),
                background: 'secondary100',
                color: 'secondary600'
            },
            link: '/plugins/content-type-builder'
        },
        components: {
            label: {
                id: 'widget.key-statistics.list.components',
                defaultMessage: 'Components'
            },
            icon: {
                component: /*#__PURE__*/ jsx(Graph, {}),
                background: 'alternative100',
                color: 'alternative600'
            },
            link: '/plugins/content-type-builder'
        },
        locales: {
            label: {
                id: 'widget.key-statistics.list.locales',
                defaultMessage: 'Locales'
            },
            icon: {
                component: /*#__PURE__*/ jsx(Earth, {}),
                background: 'success100',
                color: 'success600'
            },
            link: '/settings/internationalization'
        },
        admins: {
            label: {
                id: 'widget.key-statistics.list.admins',
                defaultMessage: 'Admins'
            },
            icon: {
                component: /*#__PURE__*/ jsx(User, {}),
                background: 'danger100',
                color: 'danger600'
            },
            link: '/settings/users?pageSize=10&page=1&sort=firstname'
        },
        webhooks: {
            label: {
                id: 'widget.key-statistics.list.webhooks',
                defaultMessage: 'Webhooks'
            },
            icon: {
                component: /*#__PURE__*/ jsx(Webhooks, {}),
                background: 'alternative100',
                color: 'alternative600'
            },
            link: '/settings/webhooks'
        },
        apiTokens: {
            label: {
                id: 'widget.key-statistics.list.apiTokens',
                defaultMessage: 'API Tokens'
            },
            icon: {
                component: /*#__PURE__*/ jsx(Key, {}),
                background: 'neutral100',
                color: 'neutral600'
            },
            link: '/settings/api-tokens?sort=name:ASC'
        }
    };
    const { draft, published, modified } = countDocuments ?? {
        draft: 0,
        published: 0,
        modified: 0
    };
    const totalCountEntries = draft + published + modified;
    return /*#__PURE__*/ jsx(Grid, {
        children: Object.entries(keyStatisticsList).map(([key, item])=>{
            const value = countKeyStatistics?.[key];
            return value !== null && /*#__PURE__*/ jsx(GridCell, {
                as: LinkCell,
                to: item.link,
                "data-testid": `stat-${key}`,
                onClick: ()=>trackUsage('didOpenKeyStatisticsWidgetLink', {
                        itemKey: key
                    }),
                children: /*#__PURE__*/ jsxs(Flex, {
                    alignItems: "center",
                    gap: 2,
                    children: [
                        /*#__PURE__*/ jsx(Flex, {
                            padding: 2,
                            borderRadius: 1,
                            background: item.icon.background,
                            color: item.icon.color,
                            children: item.icon.component
                        }),
                        /*#__PURE__*/ jsxs(Flex, {
                            direction: "column",
                            alignItems: "flex-start",
                            children: [
                                /*#__PURE__*/ jsx(Typography, {
                                    variant: "pi",
                                    fontWeight: "bold",
                                    textColor: "neutral500",
                                    children: formatMessage(item.label)
                                }),
                                /*#__PURE__*/ jsx(Typography, {
                                    variant: "omega",
                                    fontWeight: "bold",
                                    textColor: "neutral800",
                                    children: formatNumber({
                                        locale,
                                        number: key === 'entries' ? totalCountEntries : value
                                    })
                                })
                            ]
                        })
                    ]
                })
            }, `key-statistics-${key}`);
        })
    });
};

export { KeyStatisticsWidget, ProfileWidget };
//# sourceMappingURL=Widgets.mjs.map
