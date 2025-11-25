'use strict';

var jsxRuntime = require('react/jsx-runtime');
var strapiAdmin = require('@strapi/admin/strapi-admin');
var designSystem = require('@strapi/design-system');
var icons = require('@strapi/icons');
var qs = require('qs');
var reactIntl = require('react-intl');
var reactRouterDom = require('react-router-dom');
var Breadcrumbs = require('../../../../components/Breadcrumbs/Breadcrumbs.js');
require('byte-size');
require('date-fns');
var getTrad = require('../../../../utils/getTrad.js');
require('../../../../constants.js');
require('../../../../utils/urlYupSchema.js');

const Header = ({ breadcrumbs = null, canCreate, folder = null, onToggleEditFolderDialog, onToggleUploadAssetDialog })=>{
    const { formatMessage } = reactIntl.useIntl();
    const { pathname } = reactRouterDom.useLocation();
    const [{ query }] = strapiAdmin.useQueryParams();
    const backQuery = {
        ...query,
        folder: folder?.parent && typeof folder.parent !== 'number' && folder.parent.id ? folder.parent.id : undefined,
        folderPath: folder?.parent && typeof folder.parent !== 'number' && folder.parent.path ? folder.parent.path : undefined
    };
    return /*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.Layouts.Header, {
        title: formatMessage({
            id: getTrad.getTrad('plugin.name'),
            defaultMessage: `Media Library`
        }),
        subtitle: breadcrumbs && typeof breadcrumbs !== 'boolean' && folder && /*#__PURE__*/ jsxRuntime.jsx(Breadcrumbs.Breadcrumbs, {
            label: formatMessage({
                id: getTrad.getTrad('header.breadcrumbs.nav.label'),
                defaultMessage: 'Folders navigation'
            }),
            breadcrumbs: breadcrumbs,
            currentFolderId: folder?.id
        }),
        navigationAction: folder && /*#__PURE__*/ jsxRuntime.jsx(designSystem.Link, {
            tag: reactRouterDom.NavLink,
            startIcon: /*#__PURE__*/ jsxRuntime.jsx(icons.ArrowLeft, {}),
            to: `${pathname}?${qs.stringify(backQuery, {
                encode: false
            })}`,
            children: formatMessage({
                id: getTrad.getTrad('header.actions.folder-level-up'),
                defaultMessage: 'Back'
            })
        }),
        primaryAction: canCreate && /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
            gap: 2,
            children: [
                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Button, {
                    startIcon: /*#__PURE__*/ jsxRuntime.jsx(icons.Plus, {}),
                    variant: "secondary",
                    onClick: onToggleEditFolderDialog,
                    children: formatMessage({
                        id: getTrad.getTrad('header.actions.add-folder'),
                        defaultMessage: 'Add new folder'
                    })
                }),
                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Button, {
                    startIcon: /*#__PURE__*/ jsxRuntime.jsx(icons.Plus, {}),
                    onClick: onToggleUploadAssetDialog,
                    children: formatMessage({
                        id: getTrad.getTrad('header.actions.add-assets'),
                        defaultMessage: 'Add new assets'
                    })
                })
            ]
        })
    });
};

exports.Header = Header;
//# sourceMappingURL=Header.js.map
