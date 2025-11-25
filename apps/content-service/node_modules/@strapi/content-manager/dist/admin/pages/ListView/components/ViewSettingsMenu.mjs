import { jsxs, jsx } from 'react/jsx-runtime';
import 'react';
import { useQueryParams, useRBAC, useTracking } from '@strapi/admin/strapi-admin';
import { Popover, IconButton, Flex, LinkButton, useCollator, Typography, TextButton, Checkbox } from '@strapi/design-system';
import { Cog, ListPlus } from '@strapi/icons';
import { stringify } from 'qs';
import { useIntl } from 'react-intl';
import { NavLink } from 'react-router-dom';
import { useDoc } from '../../../hooks/useDocument.mjs';
import { useDocumentLayout } from '../../../hooks/useDocumentLayout.mjs';
import { useTypedSelector } from '../../../modules/hooks.mjs';
import { checkIfAttributeIsDisplayable } from '../../../utils/attributes.mjs';

const ViewSettingsMenu = (props)=>{
    const permissions = useTypedSelector((state)=>state.admin_app.permissions.contentManager?.collectionTypesConfigurations ?? []);
    const [{ query }] = useQueryParams();
    const { formatMessage } = useIntl();
    const { allowedActions: { canConfigureView } } = useRBAC(permissions);
    return /*#__PURE__*/ jsxs(Popover.Root, {
        children: [
            /*#__PURE__*/ jsx(Popover.Trigger, {
                children: /*#__PURE__*/ jsx(IconButton, {
                    label: formatMessage({
                        id: 'components.ViewSettings.tooltip',
                        defaultMessage: 'View Settings'
                    }),
                    children: /*#__PURE__*/ jsx(Cog, {})
                })
            }),
            /*#__PURE__*/ jsx(Popover.Content, {
                side: "bottom",
                align: "end",
                sideOffset: 4,
                children: /*#__PURE__*/ jsxs(Flex, {
                    alignItems: "stretch",
                    direction: "column",
                    padding: 3,
                    gap: 3,
                    children: [
                        canConfigureView ? /*#__PURE__*/ jsx(LinkButton, {
                            size: "S",
                            startIcon: /*#__PURE__*/ jsx(ListPlus, {}),
                            variant: "secondary",
                            tag: NavLink,
                            to: {
                                pathname: 'configurations/list',
                                search: query.plugins ? stringify({
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
                        /*#__PURE__*/ jsx(FieldPicker, {
                            ...props
                        })
                    ]
                })
            })
        ]
    });
};
const FieldPicker = ({ headers = [], resetHeaders, setHeaders })=>{
    const { trackUsage } = useTracking();
    const { formatMessage, locale } = useIntl();
    const { schema, model } = useDoc();
    const { list } = useDocumentLayout(model);
    const formatter = useCollator(locale, {
        sensitivity: 'base'
    });
    const attributes = schema?.attributes ?? {};
    const columns = Object.keys(attributes).filter((name)=>checkIfAttributeIsDisplayable(attributes[name])).map((name)=>({
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
    return /*#__PURE__*/ jsxs(Flex, {
        tag: "fieldset",
        direction: "column",
        alignItems: "stretch",
        gap: 3,
        borderWidth: 0,
        maxHeight: '240px',
        overflow: 'scroll',
        children: [
            /*#__PURE__*/ jsxs(Flex, {
                justifyContent: "space-between",
                children: [
                    /*#__PURE__*/ jsx(Typography, {
                        tag: "legend",
                        variant: "pi",
                        fontWeight: "bold",
                        children: formatMessage({
                            id: 'containers.list.displayedFields',
                            defaultMessage: 'Displayed fields'
                        })
                    }),
                    /*#__PURE__*/ jsx(TextButton, {
                        onClick: handleReset,
                        children: formatMessage({
                            id: 'app.components.Button.reset',
                            defaultMessage: 'Reset'
                        })
                    })
                ]
            }),
            /*#__PURE__*/ jsx(Flex, {
                direction: "column",
                alignItems: "stretch",
                children: columns.map((header)=>{
                    const isActive = headers.includes(header.name);
                    return /*#__PURE__*/ jsx(Flex, {
                        wrap: "wrap",
                        gap: 2,
                        background: isActive ? 'primary100' : 'transparent',
                        hasRadius: true,
                        padding: 2,
                        children: /*#__PURE__*/ jsx(Checkbox, {
                            onCheckedChange: ()=>handleChange(header.name),
                            checked: isActive,
                            name: header.name,
                            children: /*#__PURE__*/ jsx(Typography, {
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

export { ViewSettingsMenu };
//# sourceMappingURL=ViewSettingsMenu.mjs.map
