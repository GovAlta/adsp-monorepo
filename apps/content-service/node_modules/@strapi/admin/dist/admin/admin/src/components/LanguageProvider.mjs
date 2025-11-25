import { jsx } from 'react/jsx-runtime';
import 'react';
import defaultsDeep from 'lodash/defaultsDeep';
import { IntlProvider } from 'react-intl';
import { useTypedSelector } from '../core/store/hooks.mjs';

const LanguageProvider = ({ children, messages })=>{
    const locale = useTypedSelector((state)=>state.admin_app.language.locale);
    const appMessages = defaultsDeep(messages[locale], messages.en);
    return /*#__PURE__*/ jsx(IntlProvider, {
        locale: locale,
        defaultLocale: "en",
        messages: appMessages,
        textComponent: "span",
        children: children
    });
};

export { LanguageProvider };
//# sourceMappingURL=LanguageProvider.mjs.map
