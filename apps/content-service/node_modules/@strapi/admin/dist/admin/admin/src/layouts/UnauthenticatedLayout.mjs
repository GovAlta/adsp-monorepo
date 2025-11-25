import { jsx, jsxs } from 'react/jsx-runtime';
import 'react';
import { Box, Flex, SingleSelect, SingleSelectOption } from '@strapi/design-system';
import { useIntl } from 'react-intl';
import { styled } from 'styled-components';
import { RESPONSIVE_DEFAULT_SPACING } from '../constants/theme.mjs';
import { useTypedSelector, useTypedDispatch } from '../core/store/hooks.mjs';
import { setLocale } from '../reducer.mjs';

const Wrapper = styled(Box)`
  margin: 0 auto;
  width: 100%;
  max-width: 55.2rem;
`;
const Column = styled(Flex)`
  flex-direction: column;
`;
const LocaleToggle = ()=>{
    const localeNames = useTypedSelector((state)=>state.admin_app.language.localeNames);
    const dispatch = useTypedDispatch();
    const { formatMessage, locale } = useIntl();
    return /*#__PURE__*/ jsx(SingleSelect, {
        "aria-label": formatMessage({
            id: 'global.localeToggle.label',
            defaultMessage: 'Select interface language'
        }),
        value: locale,
        onChange: (language)=>{
            dispatch(setLocale(language));
        },
        children: Object.entries(localeNames).map(([language, name])=>/*#__PURE__*/ jsx(SingleSelectOption, {
                value: language,
                children: name
            }, language))
    });
};
const LayoutContent = ({ children })=>/*#__PURE__*/ jsx(Wrapper, {
        shadow: "tableShadow",
        hasRadius: true,
        paddingTop: RESPONSIVE_DEFAULT_SPACING,
        paddingBottom: RESPONSIVE_DEFAULT_SPACING,
        paddingLeft: RESPONSIVE_DEFAULT_SPACING,
        paddingRight: RESPONSIVE_DEFAULT_SPACING,
        background: "neutral0",
        children: children
    });
const UnauthenticatedLayout = ({ children })=>{
    return /*#__PURE__*/ jsxs("div", {
        children: [
            /*#__PURE__*/ jsx(Flex, {
                tag: "header",
                justifyContent: "flex-end",
                children: /*#__PURE__*/ jsx(Box, {
                    paddingTop: 6,
                    paddingRight: RESPONSIVE_DEFAULT_SPACING,
                    children: /*#__PURE__*/ jsx(LocaleToggle, {})
                })
            }),
            /*#__PURE__*/ jsx(Box, {
                paddingTop: 2,
                paddingBottom: RESPONSIVE_DEFAULT_SPACING,
                marginLeft: RESPONSIVE_DEFAULT_SPACING,
                marginRight: RESPONSIVE_DEFAULT_SPACING,
                children: children
            })
        ]
    });
};

export { Column, LayoutContent, UnauthenticatedLayout };
//# sourceMappingURL=UnauthenticatedLayout.mjs.map
