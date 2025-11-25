import { jsx, jsxs } from 'react/jsx-runtime';
import { Widget, useTracking } from '@strapi/admin/strapi-admin';
import { Typography, Table, Tbody, Tr, Td, Box, Badge, IconButton } from '@strapi/design-system';
import { Pencil } from '@strapi/icons';
import { useIntl } from 'react-intl';
import { useNavigate, Link } from 'react-router-dom';
import { styled } from 'styled-components';
import { getBadgeProps } from '../pages/ReleasesPage.mjs';
import { useGetUpcomingReleasesQuery } from '../services/homepage.mjs';
import { RelativeTime } from './RelativeTime.mjs';

const CellTypography = styled(Typography)`
  display: block;
  max-width: 14.4rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;
const ReleasesTable = ({ items })=>{
    const { formatMessage } = useIntl();
    const { trackUsage } = useTracking();
    const navigate = useNavigate();
    const getEditViewLink = (item)=>{
        return `/plugins/content-releases/${item.id}`;
    };
    const handleRowClick = (item)=>()=>{
            trackUsage('willEditReleaseFromHome');
            const link = getEditViewLink(item);
            navigate(link);
        };
    return /*#__PURE__*/ jsx(Table, {
        colCount: 4,
        rowCount: items?.length ?? 0,
        children: /*#__PURE__*/ jsx(Tbody, {
            children: items?.map((item)=>/*#__PURE__*/ jsxs(Tr, {
                    onClick: handleRowClick(item),
                    cursor: "pointer",
                    children: [
                        /*#__PURE__*/ jsx(Td, {
                            children: /*#__PURE__*/ jsx(CellTypography, {
                                title: item.name,
                                variant: "omega",
                                textColor: "neutral800",
                                children: item.name
                            })
                        }),
                        /*#__PURE__*/ jsx(Td, {
                            children: /*#__PURE__*/ jsx(Box, {
                                display: "inline-block",
                                children: item.status ? /*#__PURE__*/ jsx(Badge, {
                                    ...getBadgeProps(item.status),
                                    children: item.status
                                }) : /*#__PURE__*/ jsx(Typography, {
                                    textColor: "neutral600",
                                    "aria-hidden": true,
                                    children: "-"
                                })
                            })
                        }),
                        /*#__PURE__*/ jsx(Td, {
                            children: /*#__PURE__*/ jsx(Typography, {
                                variant: "omega",
                                textTransform: "capitalize",
                                textColor: "neutral600",
                                children: item.scheduledAt ? /*#__PURE__*/ jsx(RelativeTime, {
                                    timestamp: new Date(item.scheduledAt)
                                }) : formatMessage({
                                    id: 'content-releases.pages.Releases.not-scheduled',
                                    defaultMessage: 'Not scheduled'
                                })
                            })
                        }),
                        /*#__PURE__*/ jsx(Td, {
                            onClick: (e)=>e.stopPropagation(),
                            children: /*#__PURE__*/ jsx(Box, {
                                display: "inline-block",
                                children: /*#__PURE__*/ jsx(IconButton, {
                                    tag: Link,
                                    to: getEditViewLink(item),
                                    onClick: ()=>trackUsage('willEditReleaseFromHome'),
                                    label: formatMessage({
                                        id: 'content-manager.actions.edit.label',
                                        defaultMessage: 'Edit'
                                    }),
                                    variant: "ghost",
                                    children: /*#__PURE__*/ jsx(Pencil, {})
                                })
                            })
                        })
                    ]
                }, item.documentId))
        })
    });
};
/* -------------------------------------------------------------------------------------------------
 * Upcoming Releases
 * -----------------------------------------------------------------------------------------------*/ const UpcomingReleasesWidget = ()=>{
    const { formatMessage } = useIntl();
    const { data, isLoading, error } = useGetUpcomingReleasesQuery();
    if (isLoading) {
        return /*#__PURE__*/ jsx(Widget.Loading, {});
    }
    if (error || !data) {
        return /*#__PURE__*/ jsx(Widget.Error, {});
    }
    if (data.length === 0) {
        return /*#__PURE__*/ jsx(Widget.NoData, {
            children: formatMessage({
                id: 'content-releases.widget.upcoming-releases.no-data',
                defaultMessage: 'No releases'
            })
        });
    }
    return /*#__PURE__*/ jsx(ReleasesTable, {
        items: data
    });
};

export { UpcomingReleasesWidget };
//# sourceMappingURL=Widgets.mjs.map
