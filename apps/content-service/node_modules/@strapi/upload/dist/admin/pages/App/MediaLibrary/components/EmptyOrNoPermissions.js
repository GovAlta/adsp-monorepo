'use strict';

var jsxRuntime = require('react/jsx-runtime');
var designSystem = require('@strapi/design-system');
var icons = require('@strapi/icons');
var symbols = require('@strapi/icons/symbols');
var reactIntl = require('react-intl');
var EmptyAssets = require('../../../../components/EmptyAssets/EmptyAssets.js');
require('byte-size');
require('date-fns');
var getTrad = require('../../../../utils/getTrad.js');
require('qs');
require('../../../../constants.js');
require('../../../../utils/urlYupSchema.js');

const getContentIntlMessage = ({ isFiltering, canCreate, canRead })=>{
    if (isFiltering) {
        return {
            id: 'list.assets-empty.title-withSearch',
            defaultMessage: 'There are no elements with the applied filters'
        };
    }
    if (canRead) {
        if (canCreate) {
            return {
                id: 'list.assets.empty-upload',
                defaultMessage: 'Upload your first assets...'
            };
        }
        return {
            id: 'list.assets.empty',
            defaultMessage: 'Media Library is empty'
        };
    }
    return {
        id: 'header.actions.no-permissions',
        defaultMessage: 'No permissions to view'
    };
};
const EmptyOrNoPermissions = ({ canCreate, isFiltering, canRead, onActionClick })=>{
    const { formatMessage } = reactIntl.useIntl();
    const content = getContentIntlMessage({
        isFiltering,
        canCreate,
        canRead
    });
    return /*#__PURE__*/ jsxRuntime.jsx(EmptyAssets.EmptyAssets, {
        icon: !canRead ? symbols.EmptyPermissions : undefined,
        action: canCreate && !isFiltering && /*#__PURE__*/ jsxRuntime.jsx(designSystem.Button, {
            variant: "secondary",
            startIcon: /*#__PURE__*/ jsxRuntime.jsx(icons.Plus, {}),
            onClick: onActionClick,
            children: formatMessage({
                id: getTrad.getTrad('header.actions.add-assets'),
                defaultMessage: 'Add new assets'
            })
        }),
        content: formatMessage({
            ...content,
            id: getTrad.getTrad(content.id)
        })
    });
};

exports.EmptyOrNoPermissions = EmptyOrNoPermissions;
//# sourceMappingURL=EmptyOrNoPermissions.js.map
