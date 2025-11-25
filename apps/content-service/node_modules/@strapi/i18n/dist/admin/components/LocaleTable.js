'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var designSystem = require('@strapi/design-system');
var reactIntl = require('react-intl');
var getTranslation = require('../utils/getTranslation.js');
var DeleteLocale = require('./DeleteLocale.js');
var EditLocale = require('./EditLocale.js');

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

const LocaleTable = ({ locales = [], canDelete, canUpdate })=>{
    const [editLocaleId, setEditLocaleId] = React__namespace.useState();
    const { formatMessage } = reactIntl.useIntl();
    const handleClick = (localeId)=>()=>{
            if (canUpdate) {
                setEditLocaleId(localeId);
            }
        };
    return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Table, {
        colCount: 4,
        rowCount: locales.length + 1,
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Thead, {
                children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Tr, {
                    children: [
                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Th, {
                            children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                variant: "sigma",
                                textColor: "neutral600",
                                children: formatMessage({
                                    id: getTranslation.getTranslation('Settings.locales.row.id'),
                                    defaultMessage: 'ID'
                                })
                            })
                        }),
                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Th, {
                            children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                variant: "sigma",
                                textColor: "neutral600",
                                children: formatMessage({
                                    id: getTranslation.getTranslation('Settings.locales.row.displayName'),
                                    defaultMessage: 'Display name'
                                })
                            })
                        }),
                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Th, {
                            children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                variant: "sigma",
                                textColor: "neutral600",
                                children: formatMessage({
                                    id: getTranslation.getTranslation('Settings.locales.row.default-locale'),
                                    defaultMessage: 'Default locale'
                                })
                            })
                        }),
                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Th, {
                            children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.VisuallyHidden, {
                                children: "Actions"
                            })
                        })
                    ]
                })
            }),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Tbody, {
                children: locales.map((locale)=>/*#__PURE__*/ jsxRuntime.jsxs(React__namespace.Fragment, {
                        children: [
                            /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Tr, {
                                onClick: handleClick(locale.id),
                                style: {
                                    cursor: canUpdate ? 'pointer' : 'default'
                                },
                                children: [
                                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Td, {
                                        children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                            textColor: "neutral800",
                                            children: locale.id
                                        })
                                    }),
                                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Td, {
                                        children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                            textColor: "neutral800",
                                            children: locale.name
                                        })
                                    }),
                                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Td, {
                                        children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                            textColor: "neutral800",
                                            children: locale.isDefault ? formatMessage({
                                                id: getTranslation.getTranslation('Settings.locales.default'),
                                                defaultMessage: 'Default'
                                            }) : null
                                        })
                                    }),
                                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Td, {
                                        children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                                            gap: 1,
                                            justifyContent: "flex-end",
                                            onClick: (e)=>e.stopPropagation(),
                                            children: [
                                                canUpdate && /*#__PURE__*/ jsxRuntime.jsx(EditLocale.EditLocale, {
                                                    ...locale
                                                }),
                                                canDelete && !locale.isDefault && /*#__PURE__*/ jsxRuntime.jsx(DeleteLocale.DeleteLocale, {
                                                    ...locale
                                                })
                                            ]
                                        })
                                    })
                                ]
                            }),
                            /*#__PURE__*/ jsxRuntime.jsx(EditLocale.EditModal, {
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

exports.LocaleTable = LocaleTable;
//# sourceMappingURL=LocaleTable.js.map
