'use strict';

var jsxRuntime = require('react/jsx-runtime');
require('react');
var strapiAdmin = require('@strapi/admin/strapi-admin');
var designSystem = require('@strapi/design-system');
var Icons = require('@strapi/icons');
var reactIntl = require('react-intl');
var translations = require('../../../../../utils/translations.js');

const Initializer = ({ disabled, name, onClick })=>{
    const { formatMessage } = reactIntl.useIntl();
    const field = strapiAdmin.useField(name);
    return /*#__PURE__*/ jsxRuntime.jsx(jsxRuntime.Fragment, {
        children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
            tag: "button",
            background: disabled ? 'neutral150' : 'neutral100',
            borderColor: field.error ? 'danger600' : 'neutral200',
            hasRadius: true,
            disabled: disabled,
            onClick: onClick,
            paddingTop: 9,
            paddingBottom: 9,
            type: "button",
            style: {
                cursor: disabled ? 'not-allowed' : 'pointer'
            },
            children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                direction: "column",
                gap: 2,
                children: [
                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Flex, {
                        justifyContent: "center",
                        color: disabled ? 'neutral500' : 'primary600',
                        children: /*#__PURE__*/ jsxRuntime.jsx(Icons.PlusCircle, {
                            width: "3.2rem",
                            height: "3.2rem"
                        })
                    }),
                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Flex, {
                        justifyContent: "center",
                        children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                            textColor: disabled ? 'neutral600' : 'primary600',
                            variant: "pi",
                            fontWeight: "bold",
                            children: formatMessage({
                                id: translations.getTranslation('components.empty-repeatable'),
                                defaultMessage: 'No entry yet. Click to add one.'
                            })
                        })
                    })
                ]
            })
        })
    });
};

exports.Initializer = Initializer;
//# sourceMappingURL=Initializer.js.map
