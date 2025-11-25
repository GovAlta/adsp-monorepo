'use strict';

var jsxRuntime = require('react/jsx-runtime');
require('react');
var strapiAdmin = require('@strapi/admin/strapi-admin');
var designSystem = require('@strapi/design-system');
var Icons = require('@strapi/icons');
var qs = require('qs');
var reactIntl = require('react-intl');
var reactRouterDom = require('react-router-dom');
var useDocument = require('../../../hooks/useDocument.js');
var useDocumentLayout = require('../../../hooks/useDocumentLayout.js');
var hooks = require('../../../modules/hooks.js');
var attributes = require('../../../utils/attributes.js');

const ViewSettingsMenu = (props)=>{
    const permissions = hooks.useTypedSelector((state)=>state.admin_app.permissions.contentManager?.collectionTypesConfigurations ?? []);
    const [{ query }] = strapiAdmin.useQueryParams();
    const { formatMessage } = reactIntl.useIntl();
    const { allowedActions: { canConfigureView } } = strapiAdmin.useRBAC(permissions);
    return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Popover.Root, {
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Popover.Trigger, {
                children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.IconButton, {
                    label: formatMessage({
                        id: 'components.ViewSettings.tooltip',
                        defaultMessage: 'View Settings'
                    }),
                    children: /*#__PURE__*/ jsxRuntime.jsx(Icons.Cog, {})
                })
            }),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Popover.Content, {
                side: "bottom",
                align: "end",
                sideOffset: 4,
                children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                    alignItems: "stretch",
                    direction: "column",
                    padding: 3,
                    gap: 3,
                    children: [
                        canConfigureView ? /*#__PURE__*/ jsxRuntime.jsx(designSystem.LinkButton, {
                            size: "S",
                            startIcon: /*#__PURE__*/ jsxRuntime.jsx(Icons.ListPlus, {}),
                            variant: "secondary",
                            tag: reactRouterDom.NavLink,
                            to: {
                                pathname: 'configurations/list',
                                search: query.plugins ? qs.stringify({
                                    plugins: query.plugins
                                }, {
                                    encode: false
                                }) : ''
                            },
                            children: formatMessage({
                                id: 'app.links.configure-view',
                                defaultMessage: 'Configure the view'
                            })
                        }) : null,
                        /*#__PURE__*/ jsxRuntime.jsx(FieldPicker, {
                            ...props
                        })
                    ]
                })
            })
        ]
    });
};
const FieldPicker = ({ headers = [], resetHeaders, setHeaders })=>{
    const { trackUsage } = strapiAdmin.useTracking();
    const { formatMessage, locale } = reactIntl.useIntl();
    const { schema, model } = useDocument.useDoc();
    const { list } = useDocumentLayout.useDocumentLayout(model);
    const formatter = designSystem.useCollator(locale, {
        sensitivity: 'base'
    });
    const attributes$1 = schema?.attributes ?? {};
    const columns = Object.keys(attributes$1).filter((name)=>attributes.checkIfAttributeIsDisplayable(attributes$1[name])).map((name)=>({
            name,
            label: list.metadatas[name]?.label ?? ''
        })).sort((a, b)=>formatter.compare(a.label, b.label));
    const handleChange = (name)=>{
        trackUsage('didChangeDisplayedFields');
        /**
     * create an array of the new headers, if the new name exists it should be removed,
     * otherwise it should be added
     */ const newHeaders = headers.includes(name) ? headers.filter((header)=>header !== name) : [
            ...headers,
            name
        ];
        setHeaders(newHeaders);
    };
    const handleReset = ()=>{
        resetHeaders();
    };
    return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
        tag: "fieldset",
        direction: "column",
        alignItems: "stretch",
        gap: 3,
        borderWidth: 0,
        maxHeight: '240px',
        overflow: 'scroll',
        children: [
            /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                justifyContent: "space-between",
                children: [
                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                        tag: "legend",
                        variant: "pi",
                        fontWeight: "bold",
                        children: formatMessage({
                            id: 'containers.list.displayedFields',
                            defaultMessage: 'Displayed fields'
                        })
                    }),
                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.TextButton, {
                        onClick: handleReset,
                        children: formatMessage({
                            id: 'app.components.Button.reset',
                            defaultMessage: 'Reset'
                        })
                    })
                ]
            }),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Flex, {
                direction: "column",
                alignItems: "stretch",
                children: columns.map((header)=>{
                    const isActive = headers.includes(header.name);
                    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Flex, {
                        wrap: "wrap",
                        gap: 2,
                        background: isActive ? 'primary100' : 'transparent',
                        hasRadius: true,
                        padding: 2,
                        children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Checkbox, {
                            onCheckedChange: ()=>handleChange(header.name),
                            checked: isActive,
                            name: header.name,
                            children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                fontSize: 1,
                                children: header.label
                            })
                        })
                    }, header.name);
                })
            })
        ]
    });
};

exports.ViewSettingsMenu = ViewSettingsMenu;
//# sourceMappingURL=ViewSettingsMenu.js.map
