'use strict';

var jsxRuntime = require('react/jsx-runtime');
require('react');
var defaultsDeep = require('lodash/defaultsDeep');
var reactIntl = require('react-intl');
var hooks = require('../core/store/hooks.js');

const LanguageProvider = ({ children, messages })=>{
    const locale = hooks.useTypedSelector((state)=>state.admin_app.language.locale);
    const appMessages = defaultsDeep(messages[locale], messages.en);
    return /*#__PURE__*/ jsxRuntime.jsx(reactIntl.IntlProvider, {
        locale: locale,
        defaultLocale: "en",
        messages: appMessages,
        textComponent: "span",
        children: children
    });
};

exports.LanguageProvider = LanguageProvider;
//# sourceMappingURL=LanguageProvider.js.map
