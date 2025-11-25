import { jsx, jsxs } from 'react/jsx-runtime';
import 'react';
import { useTable, useQueryParams } from '@strapi/admin/strapi-admin';
import { Popover, Button, Typography, Box, Link } from '@strapi/design-system';
import { CaretDown } from '@strapi/icons';
import { useIntl } from 'react-intl';
import { useGetMappedEntriesInReleasesQuery } from '../services/release.mjs';

const useReleasesList = (contentTypeUid, documentId)=>{
    const listViewData = useTable('ListView', (state)=>state.rows);
    const documentIds = listViewData.map((entry)=>entry.documentId);
    const [{ query }] = useQueryParams();
    const locale = query?.plugins?.i18n?.locale || undefined;
    const response = useGetMappedEntriesInReleasesQuery({
        contentTypeUid,
        documentIds,
        locale
    }, {
        skip: !documentIds || !contentTypeUid || documentIds.length === 0
    });
    const mappedEntriesInReleases = response.data || {};
    return mappedEntriesInReleases?.[documentId] || [];
};
const addColumnToTableHook = ({ displayedHeaders, layout })=>{
    const { options } = layout;
    if (!options?.draftAndPublish) {
        return {
            displayedHeaders,
            layout
        };
    }
    return {
        displayedHeaders: [
            ...displayedHeaders,
            {
                searchable: false,
                sortable: false,
                name: 'releases',
                label: {
                    id: 'content-releases.content-manager.list-view.releases.header',
                    defaultMessage: 'To be released in'
                },
                cellFormatter: (props, _, { model })=>/*#__PURE__*/ jsx(ReleaseListCell, {
                        ...props,
                        model: model
                    })
            }
        ],
        layout
    };
};
const ReleaseListCell = ({ documentId, model })=>{
    const releases = useReleasesList(model, documentId);
    const { formatMessage } = useIntl();
    return /*#__PURE__*/ jsxs(Popover.Root, {
        children: [
            /*#__PURE__*/ jsx(Popover.Trigger, {
                children: /*#__PURE__*/ jsx(Button, {
                    variant: "ghost",
                    onClick: (e)=>e.stopPropagation(),
                    // TODO: find a way in the DS to define the widht and height of the icon
                    endIcon: releases.length > 0 ? /*#__PURE__*/ jsx(CaretDown, {
                        width: "1.2rem",
                        height: "1.2rem"
                    }) : null,
                    children: /*#__PURE__*/ jsx(Typography, {
                        style: {
                            maxWidth: '252px',
                            cursor: 'pointer'
                        },
                        textColor: "neutral800",
                        fontWeight: "regular",
                        children: releases.length > 0 ? formatMessage({
                            id: 'content-releases.content-manager.list-view.releases-number',
                            defaultMessage: '{number} {number, plural, one {release} other {releases}}'
                        }, {
                            number: releases.length
                        }) : '-'
                    })
                })
            }),
            /*#__PURE__*/ jsx(Popover.Content, {
                children: /*#__PURE__*/ jsx("ul", {
                    children: releases.map(({ id, name })=>/*#__PURE__*/ jsx(Box, {
                            padding: 3,
                            tag: "li",
                            children: /*#__PURE__*/ jsx(Link, {
                                href: `/admin/plugins/content-releases/${id}`,
                                isExternal: false,
                                children: name
                            })
                        }, id))
                })
            })
        ]
    });
};

export { ReleaseListCell, addColumnToTableHook };
//# sourceMappingURL=ReleaseListCell.mjs.map
