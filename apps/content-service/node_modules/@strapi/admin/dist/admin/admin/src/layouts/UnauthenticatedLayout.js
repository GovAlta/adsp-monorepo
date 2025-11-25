'use strict';

var jsxRuntime = require('react/jsx-runtime');
require('react');
var designSystem = require('@strapi/design-system');
var reactIntl = require('react-intl');
var styled = require('styled-components');
var theme = require('../constants/theme.js');
var hooks = require('../core/store/hooks.js');
var reducer = require('../reducer.js');

const Wrapper = styled.styled(designSystem.Box)`
  margin: 0 auto;
  width: 100%;
  max-width: 55.2rem;
`;
const Column = styled.styled(designSystem.Flex)`
  flex-direction: column;
`;
const LocaleToggle = ()=>{
    const localeNames = hooks.useTypedSelector((state)=>state.admin_app.language.localeNames);
    const dispatch = hooks.useTypedDispatch();
    const { formatMessage, locale } = reactIntl.useIntl();
    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.SingleSelect, {
        "aria-label": formatMessage({
            id: 'global.localeToggle.label',
            defaultMessage: 'Select interface language'
        }),
        value: locale,
        onChange: (language)=>{
            dispatch(reducer.setLocale(language));
        },
        children: Object.entries(localeNames).map(([language, name])=>/*#__PURE__*/ jsxRuntime.jsx(designSystem.SingleSelectOption, {
                value: language,
                children: name
            }, language))
    });
};
const LayoutContent = ({ children })=>/*#__PURE__*/ jsxRuntime.jsx(Wrapper, {
        shadow: "tableShadow",
        hasRadius: true,
        paddingTop: theme.RESPONSIVE_DEFAULT_SPACING,
        paddingBottom: theme.RESPONSIVE_DEFAULT_SPACING,
        paddingLeft: theme.RESPONSIVE_DEFAULT_SPACING,
        paddingRight: theme.RESPONSIVE_DEFAULT_SPACING,
        background: "neutral0",
        children: children
    });
const UnauthenticatedLayout = ({ children })=>{
    return /*#__PURE__*/ jsxRuntime.jsxs("div", {
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Flex, {
                tag: "header",
                justifyContent: "flex-end",
                children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                    paddingTop: 6,
                    paddingRight: theme.RESPONSIVE_DEFAULT_SPACING,
                    children: /*#__PURE__*/ jsxRuntime.jsx(LocaleToggle, {})
                })
            }),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                paddingTop: 2,
                paddingBottom: theme.RESPONSIVE_DEFAULT_SPACING,
                marginLeft: theme.RESPONSIVE_DEFAULT_SPACING,
                marginRight: theme.RESPONSIVE_DEFAULT_SPACING,
                children: children
            })
        ]
    });
};

exports.Column = Column;
exports.LayoutContent = LayoutContent;
exports.UnauthenticatedLayout = UnauthenticatedLayout;
//# sourceMappingURL=UnauthenticatedLayout.js.map
