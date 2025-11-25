'use strict';

var jsxRuntime = require('react/jsx-runtime');
var designSystem = require('@strapi/design-system');
var reactIntl = require('react-intl');

const PageSize = ({ onChangePageSize, pageSize })=>{
    const { formatMessage } = reactIntl.useIntl();
    const handleChange = (value)=>{
        onChangePageSize(Number(value));
    };
    return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
        children: [
            /*#__PURE__*/ jsxRuntime.jsxs(designSystem.SingleSelect, {
                size: "S",
                "aria-label": formatMessage({
                    id: 'components.PageFooter.select',
                    defaultMessage: 'Entries per page'
                }),
                onChange: handleChange,
                value: pageSize.toString(),
                children: [
                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.SingleSelectOption, {
                        value: "10",
                        children: "10"
                    }),
                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.SingleSelectOption, {
                        value: "20",
                        children: "20"
                    }),
                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.SingleSelectOption, {
                        value: "50",
                        children: "50"
                    }),
                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.SingleSelectOption, {
                        value: "100",
                        children: "100"
                    })
                ]
            }),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                paddingLeft: 2,
                children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                    textColor: "neutral600",
                    tag: "label",
                    htmlFor: "page-size",
                    children: formatMessage({
                        id: 'components.PageFooter.select',
                        defaultMessage: 'Entries per page'
                    })
                })
            })
        ]
    });
};

exports.PageSize = PageSize;
//# sourceMappingURL=PageSize.js.map
