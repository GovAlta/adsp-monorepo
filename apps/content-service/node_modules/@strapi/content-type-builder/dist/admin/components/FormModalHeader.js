'use strict';

var jsxRuntime = require('react/jsx-runtime');
var designSystem = require('@strapi/design-system');
var Icons = require('@strapi/icons');
var upperFirst = require('lodash/upperFirst');
var reactIntl = require('react-intl');
var getTrad = require('../utils/getTrad.js');
var AttributeIcon = require('./AttributeIcon.js');
var useDataManager = require('./DataManager/useDataManager.js');
var useFormModalNavigation = require('./FormModalNavigation/useFormModalNavigation.js');

const FormModalHeader = ({ actionType = null, attributeName, attributeType, contentTypeKind, dynamicZoneTarget, forTarget, modalType = null, targetUid, customFieldUid = null, showBackLink = false })=>{
    const { formatMessage } = reactIntl.useIntl();
    const { components, contentTypes } = useDataManager.useDataManager();
    const { onOpenModalAddField } = useFormModalNavigation.useFormModalNavigation();
    let icon = 'component';
    let headers = [];
    const type = forTarget === 'component' ? components[targetUid] : contentTypes[targetUid];
    const displayName = type?.info.displayName;
    if (modalType === 'contentType') {
        icon = contentTypeKind;
    }
    if ([
        'component'
    ].includes(modalType || '')) {
        icon = 'component';
    }
    const isCreatingMainSchema = [
        'component',
        'contentType'
    ].includes(modalType || '');
    if (isCreatingMainSchema) {
        let headerId = getTrad.getTrad(`modalForm.component.header-${actionType}`);
        if (modalType === 'contentType') {
            headerId = getTrad.getTrad(`modalForm.${contentTypeKind}.header-create`);
        }
        if (actionType === 'edit') {
            headerId = getTrad.getTrad(`modalForm.header-edit`);
        }
        return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Modal.Header, {
            children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                children: [
                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                        children: /*#__PURE__*/ jsxRuntime.jsx(AttributeIcon.AttributeIcon, {
                            type: icon
                        })
                    }),
                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                        paddingLeft: 3,
                        children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Modal.Title, {
                            children: formatMessage({
                                id: headerId
                            }, {
                                name: displayName
                            })
                        })
                    })
                ]
            })
        });
    }
    headers = [
        {
            label: displayName,
            info: {
                category: 'category' in type && type?.category || '',
                name: type?.info?.displayName
            }
        }
    ];
    if (modalType === 'chooseAttribute') {
        icon = forTarget === 'component' ? 'component' : 'kind' in type ? type.kind : '';
    }
    if (modalType === 'addComponentToDynamicZone') {
        icon = 'dynamiczone';
        headers.push({
            label: dynamicZoneTarget
        });
    }
    if (modalType === 'attribute' || modalType === 'customField') {
        icon = attributeType;
        headers.push({
            label: attributeName
        });
    }
    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Modal.Header, {
        children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
            gap: 3,
            children: [
                showBackLink && // This is a workaround and should use the LinkButton with a variant that currently doesn't exist
                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Link, {
                    "aria-label": formatMessage({
                        id: getTrad.getTrad('modalForm.header.back'),
                        defaultMessage: 'Back'
                    }),
                    startIcon: /*#__PURE__*/ jsxRuntime.jsx(Icons.ArrowLeft, {}),
                    onClick: ()=>onOpenModalAddField({
                            forTarget,
                            targetUid
                        }),
                    href: "#back",
                    isExternal: false
                }),
                /*#__PURE__*/ jsxRuntime.jsx(AttributeIcon.AttributeIcon, {
                    type: icon,
                    customField: customFieldUid
                }),
                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Breadcrumbs, {
                    label: headers.map(({ label })=>label).join(','),
                    children: headers.map(({ label, info }, index, arr)=>{
                        label = upperFirst(label);
                        if (!label) {
                            return null;
                        }
                        const key = `${label}.${index}`;
                        if (info?.category) {
                            label = `${label} (${upperFirst(info.category)} - ${upperFirst(info.name)})`;
                        }
                        return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Crumb, {
                            isCurrent: index === arr.length - 1,
                            children: label
                        }, key);
                    })
                })
            ]
        })
    });
};

exports.FormModalHeader = FormModalHeader;
//# sourceMappingURL=FormModalHeader.js.map
