'use strict';

var jsxRuntime = require('react/jsx-runtime');
var strapiAdmin = require('@strapi/admin/strapi-admin');
var designSystem = require('@strapi/design-system');
var Symbols = require('@strapi/icons/symbols');
var styledComponents = require('styled-components');

const iconByTypes = {
    biginteger: Symbols.NumberField,
    blocks: Symbols.BlocksField,
    boolean: Symbols.BooleanField,
    collectionType: Symbols.CollectionType,
    component: Symbols.ComponentField,
    contentType: Symbols.CollectionType,
    date: Symbols.DateField,
    datetime: Symbols.DateField,
    decimal: Symbols.NumberField,
    dynamiczone: Symbols.DynamicZoneField,
    email: Symbols.EmailField,
    enum: Symbols.EnumerationField,
    enumeration: Symbols.EnumerationField,
    file: Symbols.MediaField,
    files: Symbols.MediaField,
    float: Symbols.NumberField,
    integer: Symbols.NumberField,
    json: Symbols.JsonField,
    JSON: Symbols.JsonField,
    media: Symbols.MediaField,
    number: Symbols.NumberField,
    password: Symbols.PasswordField,
    relation: Symbols.RelationField,
    richtext: Symbols.MarkdownField,
    singleType: Symbols.SingleType,
    string: Symbols.TextField,
    text: Symbols.TextField,
    time: Symbols.DateField,
    timestamp: Symbols.DateField,
    uid: Symbols.UidField
};
const IconBox = styledComponents.styled(designSystem.Box)`
  svg {
    height: 100%;
    width: 100%;
  }
`;
const AttributeIcon = ({ type, customField = null, ...rest })=>{
    const getCustomField = strapiAdmin.useStrapiApp('AttributeIcon', (state)=>state.customFields.get);
    let Compo = iconByTypes[type];
    if (customField) {
        const customFieldObject = getCustomField(customField);
        const icon = customFieldObject?.icon;
        if (icon) {
            Compo = icon;
        }
    }
    if (!iconByTypes[type]) {
        return null;
    }
    return /*#__PURE__*/ jsxRuntime.jsx(IconBox, {
        width: "3.2rem",
        height: "3.2rem",
        shrink: 0,
        ...rest,
        "aria-hidden": true,
        children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
            tag: Compo
        })
    });
};

exports.AttributeIcon = AttributeIcon;
//# sourceMappingURL=AttributeIcon.js.map
