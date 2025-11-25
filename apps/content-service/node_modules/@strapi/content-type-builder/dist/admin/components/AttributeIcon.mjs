import { jsx } from 'react/jsx-runtime';
import { useStrapiApp } from '@strapi/admin/strapi-admin';
import { Box } from '@strapi/design-system';
import { NumberField, BlocksField, BooleanField, CollectionType, ComponentField, DateField, DynamicZoneField, EmailField, EnumerationField, MediaField, JsonField, PasswordField, RelationField, MarkdownField, SingleType, TextField, UidField } from '@strapi/icons/symbols';
import { styled } from 'styled-components';

const iconByTypes = {
    biginteger: NumberField,
    blocks: BlocksField,
    boolean: BooleanField,
    collectionType: CollectionType,
    component: ComponentField,
    contentType: CollectionType,
    date: DateField,
    datetime: DateField,
    decimal: NumberField,
    dynamiczone: DynamicZoneField,
    email: EmailField,
    enum: EnumerationField,
    enumeration: EnumerationField,
    file: MediaField,
    files: MediaField,
    float: NumberField,
    integer: NumberField,
    json: JsonField,
    JSON: JsonField,
    media: MediaField,
    number: NumberField,
    password: PasswordField,
    relation: RelationField,
    richtext: MarkdownField,
    singleType: SingleType,
    string: TextField,
    text: TextField,
    time: DateField,
    timestamp: DateField,
    uid: UidField
};
const IconBox = styled(Box)`
  svg {
    height: 100%;
    width: 100%;
  }
`;
const AttributeIcon = ({ type, customField = null, ...rest })=>{
    const getCustomField = useStrapiApp('AttributeIcon', (state)=>state.customFields.get);
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
    return /*#__PURE__*/ jsx(IconBox, {
        width: "3.2rem",
        height: "3.2rem",
        shrink: 0,
        ...rest,
        "aria-hidden": true,
        children: /*#__PURE__*/ jsx(Box, {
            tag: Compo
        })
    });
};

export { AttributeIcon };
//# sourceMappingURL=AttributeIcon.mjs.map
