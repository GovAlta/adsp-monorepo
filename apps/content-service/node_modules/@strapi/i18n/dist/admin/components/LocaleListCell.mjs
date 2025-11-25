import { jsxs, jsx } from 'react/jsx-runtime';
import { useCollator, Popover, Button, Flex, Typography, Box } from '@strapi/design-system';
import { CaretDown } from '@strapi/icons';
import { useIntl } from 'react-intl';
import { useGetLocalesQuery } from '../services/locales.mjs';

const LocaleListCell = ({ locale: currentLocale, localizations })=>{
    const { locale: language } = useIntl();
    const { data: locales = [] } = useGetLocalesQuery();
    const formatter = useCollator(language, {
        sensitivity: 'base'
    });
    if (!Array.isArray(locales) || !localizations) {
        return null;
    }
    const availableLocales = localizations.map((loc)=>loc.locale);
    const localesForDocument = locales.reduce((acc, locale)=>{
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
    return /*#__PURE__*/ jsxs(Popover.Root, {
        children: [
            /*#__PURE__*/ jsx(Popover.Trigger, {
                children: /*#__PURE__*/ jsx(Button, {
                    variant: "ghost",
                    type: "button",
                    onClick: (e)=>e.stopPropagation(),
                    children: /*#__PURE__*/ jsxs(Flex, {
                        minWidth: "100%",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: "regular",
                        children: [
                            /*#__PURE__*/ jsx(Typography, {
                                textColor: "neutral800",
                                ellipsis: true,
                                marginRight: 2,
                                children: localesForDocument.join(', ')
                            }),
                            /*#__PURE__*/ jsx(Flex, {
                                children: /*#__PURE__*/ jsx(CaretDown, {
                                    width: "1.2rem",
                                    height: "1.2rem"
                                })
                            })
                        ]
                    })
                })
            }),
            /*#__PURE__*/ jsx(Popover.Content, {
                sideOffset: 16,
                children: /*#__PURE__*/ jsx("ul", {
                    children: localesForDocument.map((name)=>/*#__PURE__*/ jsx(Box, {
                            padding: 3,
                            tag: "li",
                            children: /*#__PURE__*/ jsx(Typography, {
                                children: name
                            })
                        }, name))
                })
            })
        ]
    });
};

export { LocaleListCell };
//# sourceMappingURL=LocaleListCell.mjs.map
