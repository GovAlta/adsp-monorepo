'use strict';

var jsxRuntime = require('react/jsx-runtime');
require('react');
var strapiAdmin = require('@strapi/admin/strapi-admin');
var designSystem = require('@strapi/design-system');
var Symbols = require('@strapi/icons/symbols');

const iconByTypes = {
    biginteger: /*#__PURE__*/ jsxRuntime.jsx(Symbols.NumberField, {}),
    boolean: /*#__PURE__*/ jsxRuntime.jsx(Symbols.BooleanField, {}),
    date: /*#__PURE__*/ jsxRuntime.jsx(Symbols.DateField, {}),
    datetime: /*#__PURE__*/ jsxRuntime.jsx(Symbols.DateField, {}),
    decimal: /*#__PURE__*/ jsxRuntime.jsx(Symbols.NumberField, {}),
    email: /*#__PURE__*/ jsxRuntime.jsx(Symbols.EmailField, {}),
    enumeration: /*#__PURE__*/ jsxRuntime.jsx(Symbols.EnumerationField, {}),
    float: /*#__PURE__*/ jsxRuntime.jsx(Symbols.NumberField, {}),
    integer: /*#__PURE__*/ jsxRuntime.jsx(Symbols.NumberField, {}),
    media: /*#__PURE__*/ jsxRuntime.jsx(Symbols.MediaField, {}),
    password: /*#__PURE__*/ jsxRuntime.jsx(Symbols.PasswordField, {}),
    relation: /*#__PURE__*/ jsxRuntime.jsx(Symbols.RelationField, {}),
    string: /*#__PURE__*/ jsxRuntime.jsx(Symbols.TextField, {}),
    text: /*#__PURE__*/ jsxRuntime.jsx(Symbols.TextField, {}),
    richtext: /*#__PURE__*/ jsxRuntime.jsx(Symbols.TextField, {}),
    time: /*#__PURE__*/ jsxRuntime.jsx(Symbols.DateField, {}),
    timestamp: /*#__PURE__*/ jsxRuntime.jsx(Symbols.DateField, {}),
    json: /*#__PURE__*/ jsxRuntime.jsx(Symbols.JsonField, {}),
    uid: /*#__PURE__*/ jsxRuntime.jsx(Symbols.UidField, {}),
    component: /*#__PURE__*/ jsxRuntime.jsx(Symbols.ComponentField, {}),
    dynamiczone: /*#__PURE__*/ jsxRuntime.jsx(Symbols.DynamicZoneField, {}),
    blocks: /*#__PURE__*/ jsxRuntime.jsx(Symbols.BlocksField, {})
};
const FieldTypeIcon = ({ type, customFieldUid })=>{
    const getCustomField = strapiAdmin.useStrapiApp('FieldTypeIcon', (state)=>state.customFields.get);
    if (!type) {
        return null;
    }
    let Compo = iconByTypes[type];
    if (customFieldUid) {
        const customField = getCustomField(customFieldUid);
        const CustomFieldIcon = customField?.icon;
        if (CustomFieldIcon) {
            Compo = /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                marginRight: 3,
                width: 7,
                height: 6,
                children: /*#__PURE__*/ jsxRuntime.jsx(CustomFieldIcon, {})
            });
        }
    }
    if (!iconByTypes[type]) {
        return null;
    }
    return Compo;
};

exports.FieldTypeIcon = FieldTypeIcon;
//# sourceMappingURL=FieldTypeIcon.js.map
