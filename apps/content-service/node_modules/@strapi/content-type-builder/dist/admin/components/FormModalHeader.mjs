import { jsx, jsxs } from 'react/jsx-runtime';
import { Modal, Flex, Box, Link, Breadcrumbs, Crumb } from '@strapi/design-system';
import { ArrowLeft } from '@strapi/icons';
import upperFirst from 'lodash/upperFirst';
import { useIntl } from 'react-intl';
import { getTrad } from '../utils/getTrad.mjs';
import { AttributeIcon } from './AttributeIcon.mjs';
import { useDataManager } from './DataManager/useDataManager.mjs';
import { useFormModalNavigation } from './FormModalNavigation/useFormModalNavigation.mjs';

const FormModalHeader = ({ actionType = null, attributeName, attributeType, contentTypeKind, dynamicZoneTarget, forTarget, modalType = null, targetUid, customFieldUid = null, showBackLink = false })=>{
    const { formatMessage } = useIntl();
    const { components, contentTypes } = useDataManager();
    const { onOpenModalAddField } = useFormModalNavigation();
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
        let headerId = getTrad(`modalForm.component.header-${actionType}`);
        if (modalType === 'contentType') {
            headerId = getTrad(`modalForm.${contentTypeKind}.header-create`);
        }
        if (actionType === 'edit') {
            headerId = getTrad(`modalForm.header-edit`);
        }
        return /*#__PURE__*/ jsx(Modal.Header, {
            children: /*#__PURE__*/ jsxs(Flex, {
                children: [
                    /*#__PURE__*/ jsx(Box, {
                        children: /*#__PURE__*/ jsx(AttributeIcon, {
                            type: icon
                        })
                    }),
                    /*#__PURE__*/ jsx(Box, {
                        paddingLeft: 3,
                        children: /*#__PURE__*/ jsx(Modal.Title, {
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
    return /*#__PURE__*/ jsx(Modal.Header, {
        children: /*#__PURE__*/ jsxs(Flex, {
            gap: 3,
            children: [
                showBackLink && // This is a workaround and should use the LinkButton with a variant that currently doesn't exist
                /*#__PURE__*/ jsx(Link, {
                    "aria-label": formatMessage({
                        id: getTrad('modalForm.header.back'),
                        defaultMessage: 'Back'
                    }),
                    startIcon: /*#__PURE__*/ jsx(ArrowLeft, {}),
                    onClick: ()=>onOpenModalAddField({
                            forTarget,
                            targetUid
                        }),
                    href: "#back",
                    isExternal: false
                }),
                /*#__PURE__*/ jsx(AttributeIcon, {
                    type: icon,
                    customField: customFieldUid
                }),
                /*#__PURE__*/ jsx(Breadcrumbs, {
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
                        return /*#__PURE__*/ jsx(Crumb, {
                            isCurrent: index === arr.length - 1,
                            children: label
                        }, key);
                    })
                })
            ]
        })
    });
};

export { FormModalHeader };
//# sourceMappingURL=FormModalHeader.mjs.map
