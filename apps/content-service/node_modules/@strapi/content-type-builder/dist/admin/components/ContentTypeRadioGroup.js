'use strict';

var jsxRuntime = require('react/jsx-runtime');
var strapiAdmin = require('@strapi/admin/strapi-admin');
var reactIntl = require('react-intl');
var getTrad = require('../utils/getTrad.js');
var CustomRadioGroup = require('./CustomRadioGroup/CustomRadioGroup.js');

const ContentTypeRadioGroup = ({ onChange, ...rest })=>{
    const { formatMessage } = reactIntl.useIntl();
    const { toggleNotification } = strapiAdmin.useNotification();
    const handleChange = (e)=>{
        toggleNotification({
            type: 'info',
            message: formatMessage({
                id: getTrad.getTrad('contentType.kind.change.warning'),
                defaultMessage: 'You just changed the kind of a content type: API will be reset (routes, controllers, and services will be overwritten).'
            })
        });
        onChange(e);
    };
    return /*#__PURE__*/ jsxRuntime.jsx(CustomRadioGroup.CustomRadioGroup, {
        ...rest,
        onChange: handleChange
    });
};

exports.ContentTypeRadioGroup = ContentTypeRadioGroup;
//# sourceMappingURL=ContentTypeRadioGroup.js.map
