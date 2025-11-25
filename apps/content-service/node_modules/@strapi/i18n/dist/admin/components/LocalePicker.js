'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var strapiAdmin = require('@strapi/admin/strapi-admin');
var designSystem = require('@strapi/design-system');
var reactIntl = require('react-intl');
var useI18n = require('../hooks/useI18n.js');
var locales = require('../services/locales.js');
var getTranslation = require('../utils/getTranslation.js');

function _interopNamespaceDefault(e) {
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  }
  n.default = e;
  return Object.freeze(n);
}

var React__namespace = /*#__PURE__*/_interopNamespaceDefault(React);

const LocalePicker = ()=>{
    const { formatMessage } = reactIntl.useIntl();
    const [{ query }, setQuery] = strapiAdmin.useQueryParams();
    const { hasI18n, canRead, canCreate } = useI18n.useI18n();
    const { data: locales$1 = [] } = locales.useGetLocalesQuery(undefined, {
        skip: !hasI18n
    });
    const handleChange = React__namespace.useCallback((code, replace = false)=>{
        setQuery({
            page: 1,
            plugins: {
                ...query.plugins,
                i18n: {
                    locale: code
                }
            }
        }, 'push', replace);
    }, [
        query.plugins,
        setQuery
    ]);
    React__namespace.useEffect(()=>{
        if (!Array.isArray(locales$1) || !hasI18n) {
            return;
        }
        /**
     * Handle the case where the current locale query param doesn't exist
     * in the list of available locales, so we redirect to the default locale.
     */ const currentDesiredLocale = query.plugins?.i18n?.locale;
        const doesLocaleExist = locales$1.find((loc)=>loc.code === currentDesiredLocale);
        const defaultLocale = locales$1.find((locale)=>locale.isDefault);
        if (!doesLocaleExist && defaultLocale?.code) {
            handleChange(defaultLocale.code, true);
        }
    }, [
        hasI18n,
        handleChange,
        locales$1,
        query.plugins?.i18n?.locale
    ]);
    if (!hasI18n || !Array.isArray(locales$1) || locales$1.length === 0) {
        return null;
    }
    const displayedLocales = locales$1.filter((locale)=>{
        /**
     * If you can create or read we allow you to see the locale exists
     * this is because in the ListView, you may be able to create a new entry
     * in a locale you can't read.
     */ return canCreate.includes(locale.code) || canRead.includes(locale.code);
    });
    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.SingleSelect, {
        size: "S",
        "aria-label": formatMessage({
            id: getTranslation.getTranslation('actions.select-locale'),
            defaultMessage: 'Select locale'
        }),
        value: query.plugins?.i18n?.locale || locales$1.find((locale)=>locale.isDefault)?.code,
        // @ts-expect-error – This can be removed in V2 of the DS.
        onChange: handleChange,
        children: displayedLocales.map((locale)=>/*#__PURE__*/ jsxRuntime.jsx(designSystem.SingleSelectOption, {
                value: locale.code,
                children: locale.name
            }, locale.id))
    });
};

exports.LocalePicker = LocalePicker;
//# sourceMappingURL=LocalePicker.js.map
