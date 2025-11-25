import { jsx } from 'react/jsx-runtime';
import 'react';
import { useStrapiApp } from '@strapi/admin/strapi-admin';
import { Box } from '@strapi/design-system';
import { NumberField, BooleanField, DateField, EmailField, EnumerationField, MediaField, PasswordField, RelationField, TextField, JsonField, UidField, ComponentField, DynamicZoneField, BlocksField } from '@strapi/icons/symbols';

const iconByTypes = {
    biginteger: /*#__PURE__*/ jsx(NumberField, {}),
    boolean: /*#__PURE__*/ jsx(BooleanField, {}),
    date: /*#__PURE__*/ jsx(DateField, {}),
    datetime: /*#__PURE__*/ jsx(DateField, {}),
    decimal: /*#__PURE__*/ jsx(NumberField, {}),
    email: /*#__PURE__*/ jsx(EmailField, {}),
    enumeration: /*#__PURE__*/ jsx(EnumerationField, {}),
    float: /*#__PURE__*/ jsx(NumberField, {}),
    integer: /*#__PURE__*/ jsx(NumberField, {}),
    media: /*#__PURE__*/ jsx(MediaField, {}),
    password: /*#__PURE__*/ jsx(PasswordField, {}),
    relation: /*#__PURE__*/ jsx(RelationField, {}),
    string: /*#__PURE__*/ jsx(TextField, {}),
    text: /*#__PURE__*/ jsx(TextField, {}),
    richtext: /*#__PURE__*/ jsx(TextField, {}),
    time: /*#__PURE__*/ jsx(DateField, {}),
    timestamp: /*#__PURE__*/ jsx(DateField, {}),
    json: /*#__PURE__*/ jsx(JsonField, {}),
    uid: /*#__PURE__*/ jsx(UidField, {}),
    component: /*#__PURE__*/ jsx(ComponentField, {}),
    dynamiczone: /*#__PURE__*/ jsx(DynamicZoneField, {}),
    blocks: /*#__PURE__*/ jsx(BlocksField, {})
};
const FieldTypeIcon = ({ type, customFieldUid })=>{
    const getCustomField = useStrapiApp('FieldTypeIcon', (state)=>state.customFields.get);
    if (!type) {
        return null;
    }
    let Compo = iconByTypes[type];
    if (customFieldUid) {
        const customField = getCustomField(customFieldUid);
        const CustomFieldIcon = customField?.icon;
        if (CustomFieldIcon) {
            Compo = /*#__PURE__*/ jsx(Box, {
                marginRight: 3,
                width: 7,
                height: 6,
                children: /*#__PURE__*/ jsx(CustomFieldIcon, {})
            });
        }
    }
    if (!iconByTypes[type]) {
        return null;
    }
    return Compo;
};

export { FieldTypeIcon };
//# sourceMappingURL=FieldTypeIcon.mjs.map
