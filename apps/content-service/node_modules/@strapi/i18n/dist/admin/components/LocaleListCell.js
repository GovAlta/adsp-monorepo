'use strict';

var jsxRuntime = require('react/jsx-runtime');
var designSystem = require('@strapi/design-system');
var icons = require('@strapi/icons');
var reactIntl = require('react-intl');
var locales = require('../services/locales.js');

const LocaleListCell = ({ locale: currentLocale, localizations })=>{
    const { locale: language } = reactIntl.useIntl();
    const { data: locales$1 = [] } = locales.useGetLocalesQuery();
    const formatter = designSystem.useCollator(language, {
        sensitivity: 'base'
    });
    if (!Array.isArray(locales$1) || !localizations) {
        return null;
    }
    const availableLocales = localizations.map((loc)=>loc.locale);
    const localesForDocument = locales$1.reduce((acc, locale)=>{
        const createdLocale = [
            currentLocale,
            ...availableLocales
        ].find((loc)=>{
            return loc === locale.code;
        });
        if (createdLocale) {
            acc.push(locale);
        }
        return acc;
    }, []).map((locale)=>{
        if (locale.isDefault) {
            return `${locale.name} (default)`;
        }
        return locale.name;
    }).toSorted((a, b)=>formatter.compare(a, b));
    return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Popover.Root, {
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Popover.Trigger, {
                children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Button, {
                    variant: "ghost",
                    type: "button",
                    onClick: (e)=>e.stopPropagation(),
                    children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                        minWidth: "100%",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: "regular",
                        children: [
                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                textColor: "neutral800",
                                ellipsis: true,
                                marginRight: 2,
                                children: localesForDocument.join(', ')
                            }),
                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Flex, {
                                children: /*#__PURE__*/ jsxRuntime.jsx(icons.CaretDown, {
                                    width: "1.2rem",
                                    height: "1.2rem"
                                })
                            })
                        ]
                    })
                })
            }),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Popover.Content, {
                sideOffset: 16,
                children: /*#__PURE__*/ jsxRuntime.jsx("ul", {
                    children: localesForDocument.map((name)=>/*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                            padding: 3,
                            tag: "li",
                            children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                children: name
                            })
                        }, name))
                })
            })
        ]
    });
};

exports.LocaleListCell = LocaleListCell;
//# sourceMappingURL=LocaleListCell.js.map
