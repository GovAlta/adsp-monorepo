import { jsxs, jsx } from 'react/jsx-runtime';
import * as React from 'react';
import { Table, Thead, Tr, Th, Typography, VisuallyHidden, Tbody, Td, Flex } from '@strapi/design-system';
import { useIntl } from 'react-intl';
import { getTranslation } from '../utils/getTranslation.mjs';
import { DeleteLocale } from './DeleteLocale.mjs';
import { EditLocale, EditModal } from './EditLocale.mjs';

const LocaleTable = ({ locales = [], canDelete, canUpdate })=>{
    const [editLocaleId, setEditLocaleId] = React.useState();
    const { formatMessage } = useIntl();
    const handleClick = (localeId)=>()=>{
            if (canUpdate) {
                setEditLocaleId(localeId);
            }
        };
    return /*#__PURE__*/ jsxs(Table, {
        colCount: 4,
        rowCount: locales.length + 1,
        children: [
            /*#__PURE__*/ jsx(Thead, {
                children: /*#__PURE__*/ jsxs(Tr, {
                    children: [
                        /*#__PURE__*/ jsx(Th, {
                            children: /*#__PURE__*/ jsx(Typography, {
                                variant: "sigma",
                                textColor: "neutral600",
                                children: formatMessage({
                                    id: getTranslation('Settings.locales.row.id'),
                                    defaultMessage: 'ID'
                                })
                            })
                        }),
                        /*#__PURE__*/ jsx(Th, {
                            children: /*#__PURE__*/ jsx(Typography, {
                                variant: "sigma",
                                textColor: "neutral600",
                                children: formatMessage({
                                    id: getTranslation('Settings.locales.row.displayName'),
                                    defaultMessage: 'Display name'
                                })
                            })
                        }),
                        /*#__PURE__*/ jsx(Th, {
                            children: /*#__PURE__*/ jsx(Typography, {
                                variant: "sigma",
                                textColor: "neutral600",
                                children: formatMessage({
                                    id: getTranslation('Settings.locales.row.default-locale'),
                                    defaultMessage: 'Default locale'
                                })
                            })
                        }),
                        /*#__PURE__*/ jsx(Th, {
                            children: /*#__PURE__*/ jsx(VisuallyHidden, {
                                children: "Actions"
                            })
                        })
                    ]
                })
            }),
            /*#__PURE__*/ jsx(Tbody, {
                children: locales.map((locale)=>/*#__PURE__*/ jsxs(React.Fragment, {
                        children: [
                            /*#__PURE__*/ jsxs(Tr, {
                                onClick: handleClick(locale.id),
                                style: {
                                    cursor: canUpdate ? 'pointer' : 'default'
                                },
                                children: [
                                    /*#__PURE__*/ jsx(Td, {
                                        children: /*#__PURE__*/ jsx(Typography, {
                                            textColor: "neutral800",
                                            children: locale.id
                                        })
                                    }),
                                    /*#__PURE__*/ jsx(Td, {
                                        children: /*#__PURE__*/ jsx(Typography, {
                                            textColor: "neutral800",
                                            children: locale.name
                                        })
                                    }),
                                    /*#__PURE__*/ jsx(Td, {
                                        children: /*#__PURE__*/ jsx(Typography, {
                                            textColor: "neutral800",
                                            children: locale.isDefault ? formatMessage({
                                                id: getTranslation('Settings.locales.default'),
                                                defaultMessage: 'Default'
                                            }) : null
                                        })
                                    }),
                                    /*#__PURE__*/ jsx(Td, {
                                        children: /*#__PURE__*/ jsxs(Flex, {
                                            gap: 1,
                                            justifyContent: "flex-end",
                                            onClick: (e)=>e.stopPropagation(),
                                            children: [
                                                canUpdate && /*#__PURE__*/ jsx(EditLocale, {
                                                    ...locale
                                                }),
                                                canDelete && !locale.isDefault && /*#__PURE__*/ jsx(DeleteLocale, {
                                                    ...locale
                                                })
                                            ]
                                        })
                                    })
                                ]
                            }),
                            /*#__PURE__*/ jsx(EditModal, {
                                ...locale,
                                onOpenChange: ()=>setEditLocaleId(undefined),
                                open: editLocaleId === locale.id
                            })
                        ]
                    }, locale.id))
            })
        ]
    });
};

export { LocaleTable };
//# sourceMappingURL=LocaleTable.mjs.map
