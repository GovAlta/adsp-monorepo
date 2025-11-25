'use strict';

var jsxRuntime = require('react/jsx-runtime');
require('react');
var strapiAdmin = require('@strapi/admin/strapi-admin');
var designSystem = require('@strapi/design-system');
var icons = require('@strapi/icons');
var reactIntl = require('react-intl');
var release = require('../services/release.js');

const useReleasesList = (contentTypeUid, documentId)=>{
    const listViewData = strapiAdmin.useTable('ListView', (state)=>state.rows);
    const documentIds = listViewData.map((entry)=>entry.documentId);
    const [{ query }] = strapiAdmin.useQueryParams();
    const locale = query?.plugins?.i18n?.locale || undefined;
    const response = release.useGetMappedEntriesInReleasesQuery({
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
                cellFormatter: (props, _, { model })=>/*#__PURE__*/ jsxRuntime.jsx(ReleaseListCell, {
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
    const { formatMessage } = reactIntl.useIntl();
    return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Popover.Root, {
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Popover.Trigger, {
                children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Button, {
                    variant: "ghost",
                    onClick: (e)=>e.stopPropagation(),
                    // TODO: find a way in the DS to define the widht and height of the icon
                    endIcon: releases.length > 0 ? /*#__PURE__*/ jsxRuntime.jsx(icons.CaretDown, {
                        width: "1.2rem",
                        height: "1.2rem"
                    }) : null,
                    children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
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
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Popover.Content, {
                children: /*#__PURE__*/ jsxRuntime.jsx("ul", {
                    children: releases.map(({ id, name })=>/*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                            padding: 3,
                            tag: "li",
                            children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Link, {
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

exports.ReleaseListCell = ReleaseListCell;
exports.addColumnToTableHook = addColumnToTableHook;
//# sourceMappingURL=ReleaseListCell.js.map
