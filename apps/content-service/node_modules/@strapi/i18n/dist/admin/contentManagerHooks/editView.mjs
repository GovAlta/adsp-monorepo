import { jsx, jsxs } from 'react/jsx-runtime';
import * as React from 'react';
import { Flex, VisuallyHidden } from '@strapi/design-system';
import { Earth } from '@strapi/icons';
import { useIntl } from 'react-intl';
import { styled } from 'styled-components';
import { getTranslation } from '../utils/getTranslation.mjs';

const mutateEditViewHook = ({ layout })=>{
    // If i18n isn't explicitly enabled on the content type, then no field can be localized
    if (!('i18n' in layout.options) || typeof layout.options.i18n === 'object' && layout.options.i18n !== null && 'localized' in layout.options.i18n && !layout.options.i18n.localized) {
        return {
            layout
        };
    }
    const components = Object.entries(layout.components).reduce((acc, [key, componentLayout])=>{
        return {
            ...acc,
            [key]: {
                ...componentLayout,
                layout: componentLayout.layout.map((row)=>row.map(addLabelActionToField))
            }
        };
    }, {});
    return {
        layout: {
            ...layout,
            components,
            layout: layout.layout.map((panel)=>panel.map((row)=>row.map(addLabelActionToField)))
        }
    };
};
const addLabelActionToField = (field)=>{
    const isFieldLocalized = doesFieldHaveI18nPluginOpt(field.attribute.pluginOptions) ? field.attribute.pluginOptions.i18n.localized : true;
    const labelActionProps = {
        title: {
            id: isFieldLocalized ? getTranslation('Field.localized') : getTranslation('Field.not-localized'),
            defaultMessage: isFieldLocalized ? 'This value is unique for the selected locale' : 'This value is the same across all locales'
        },
        icon: isFieldLocalized ? /*#__PURE__*/ jsx(Earth, {}) : null
    };
    return {
        ...field,
        labelAction: isFieldLocalized ? /*#__PURE__*/ jsx(LabelAction, {
            ...labelActionProps
        }) : null
    };
};
const doesFieldHaveI18nPluginOpt = (pluginOpts)=>{
    if (!pluginOpts) {
        return false;
    }
    return 'i18n' in pluginOpts && typeof pluginOpts.i18n === 'object' && pluginOpts.i18n !== null && 'localized' in pluginOpts.i18n;
};
const LabelAction = ({ title, icon })=>{
    const { formatMessage } = useIntl();
    return /*#__PURE__*/ jsxs(Span, {
        tag: "span",
        children: [
            /*#__PURE__*/ jsx(VisuallyHidden, {
                tag: "span",
                children: formatMessage(title)
            }),
            /*#__PURE__*/ React.cloneElement(icon, {
                'aria-hidden': true,
                focusable: false
            })
        ]
    });
};
const Span = styled(Flex)`
  svg {
    width: 12px;
    height: 12px;

    fill: ${({ theme })=>theme.colors.neutral500};

    path {
      fill: ${({ theme })=>theme.colors.neutral500};
    }
  }
`;

export { mutateEditViewHook };
//# sourceMappingURL=editView.mjs.map
