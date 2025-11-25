'use strict';

var jsxRuntime = require('react/jsx-runtime');
var strapiAdmin = require('@strapi/admin/strapi-admin');
var designSystem = require('@strapi/design-system');
var reactIntl = require('react-intl');
var getTrad = require('../../utils/getTrad.js');
var CustomFieldOption = require('./CustomFieldOption.js');
var EmptyAttributes = require('./EmptyAttributes.js');

const CustomFieldsList = ()=>{
    const { formatMessage } = reactIntl.useIntl();
    const getAllCustomFields = strapiAdmin.useStrapiApp('CustomFieldsList', (state)=>state.customFields.getAll);
    // TODO change this once useCustomFields is typed (helper-plugin types are solved)
    const registeredCustomFields = Object.entries(getAllCustomFields());
    if (!registeredCustomFields.length) {
        return /*#__PURE__*/ jsxRuntime.jsx(EmptyAttributes.EmptyAttributes, {});
    }
    // Sort the array alphabetically by customField name
    const sortedCustomFields = registeredCustomFields.sort((a, b)=>a[1].name > b[1].name ? 1 : -1);
    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.KeyboardNavigable, {
        tagName: "button",
        children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
            direction: "column",
            alignItems: "stretch",
            gap: 3,
            children: [
                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Grid.Root, {
                    gap: 3,
                    children: sortedCustomFields.map(([uid, customField])=>/*#__PURE__*/ jsxRuntime.jsx(designSystem.Grid.Item, {
                            col: 6,
                            direction: "column",
                            alignItems: "stretch",
                            children: /*#__PURE__*/ jsxRuntime.jsx(CustomFieldOption.CustomFieldOption, {
                                customFieldUid: uid,
                                customField: customField
                            }, uid)
                        }, uid))
                }),
                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Link, {
                    href: "https://docs.strapi.io/developer-docs/latest/development/custom-fields.html",
                    isExternal: true,
                    children: formatMessage({
                        id: getTrad.getTrad('modalForm.tabs.custom.howToLink'),
                        defaultMessage: 'How to add custom fields'
                    })
                })
            ]
        })
    });
};

exports.CustomFieldsList = CustomFieldsList;
//# sourceMappingURL=CustomFieldsList.js.map
