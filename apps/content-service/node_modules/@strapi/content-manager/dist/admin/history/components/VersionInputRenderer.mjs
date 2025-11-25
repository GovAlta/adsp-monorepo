import { jsx, jsxs, Fragment } from 'react/jsx-runtime';
import * as React from 'react';
import { useForm, useStrapiApp, InputRenderer, useField, Form } from '@strapi/admin/strapi-admin';
import { Alert, Link, Flex, Field, Box, Tooltip, Typography } from '@strapi/design-system';
import { useIntl } from 'react-intl';
import { NavLink } from 'react-router-dom';
import { styled } from 'styled-components';
import { COLLECTION_TYPES } from '../../constants/collections.mjs';
import { useDocumentRBAC } from '../../features/DocumentRBAC.mjs';
import { useDoc } from '../../hooks/useDocument.mjs';
import { useDocLayout } from '../../hooks/useDocumentLayout.mjs';
import { useLazyComponents } from '../../hooks/useLazyComponents.mjs';
import { useTypedSelector } from '../../modules/hooks.mjs';
import { DocumentStatus } from '../../pages/EditView/components/DocumentStatus.mjs';
import { BlocksInput as MemoizedBlocksInput } from '../../pages/EditView/components/FormInputs/BlocksInput/BlocksInput.mjs';
import { ComponentInput as MemoizedComponentInput } from '../../pages/EditView/components/FormInputs/Component/Input.mjs';
import { useDynamicZone, DynamicZone } from '../../pages/EditView/components/FormInputs/DynamicZone/Field.mjs';
import { NotAllowedInput } from '../../pages/EditView/components/FormInputs/NotAllowed.mjs';
import { UIDInput as MemoizedUIDInput } from '../../pages/EditView/components/FormInputs/UID.mjs';
import { Wysiwyg as MemoizedWysiwyg } from '../../pages/EditView/components/FormInputs/Wysiwyg/Field.mjs';
import { useFieldHint } from '../../pages/EditView/components/InputRenderer.mjs';
import { getRelationLabel } from '../../utils/relations.mjs';
import { useHistoryContext } from '../pages/History.mjs';
import { getRemaingFieldsLayout } from './VersionContent.mjs';

const StyledAlert = styled(Alert).attrs({
    closeLabel: 'Close',
    onClose: ()=>{},
    shadow: 'none'
})`
  button {
    display: none;
  }
`;
/* -------------------------------------------------------------------------------------------------
 * CustomRelationInput
 * -----------------------------------------------------------------------------------------------*/ const LinkEllipsis = styled(Link)`
  display: block;

  & > span {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    display: block;
  }
`;
const CustomRelationInput = (props)=>{
    const { formatMessage } = useIntl();
    const field = useField(props.name);
    /**
   * Ideally the server would return the correct shape, however, for admin user relations
   * it sanitizes everything out when it finds an object for the relation value.
   */ let formattedFieldValue;
    if (field) {
        formattedFieldValue = Array.isArray(field.value) ? {
            results: field.value,
            meta: {
                missingCount: 0
            }
        } : field.value;
    }
    if (!formattedFieldValue || formattedFieldValue.results.length === 0 && formattedFieldValue.meta.missingCount === 0) {
        return /*#__PURE__*/ jsxs(Fragment, {
            children: [
                /*#__PURE__*/ jsx(Field.Label, {
                    action: props.labelAction,
                    children: props.label
                }),
                /*#__PURE__*/ jsx(Box, {
                    marginTop: 1,
                    children: /*#__PURE__*/ jsx(StyledAlert, {
                        variant: "default",
                        children: formatMessage({
                            id: 'content-manager.history.content.no-relations',
                            defaultMessage: 'No relations.'
                        })
                    })
                })
            ]
        });
    }
    const { results, meta } = formattedFieldValue;
    return /*#__PURE__*/ jsxs(Box, {
        children: [
            /*#__PURE__*/ jsx(Field.Label, {
                children: props.label
            }),
            results.length > 0 && /*#__PURE__*/ jsx(Flex, {
                direction: "column",
                gap: 2,
                marginTop: 1,
                alignItems: "stretch",
                children: results.map((relationData)=>{
                    // @ts-expect-error - targetModel does exist on the attribute. But it's not typed.
                    const { targetModel } = props.attribute;
                    const href = `../${COLLECTION_TYPES}/${targetModel}/${relationData.documentId}`;
                    const label = getRelationLabel(relationData, props.mainField);
                    const isAdminUserRelation = targetModel === 'admin::user';
                    return /*#__PURE__*/ jsxs(Flex, {
                        paddingTop: 2,
                        paddingBottom: 2,
                        paddingLeft: 4,
                        paddingRight: 4,
                        hasRadius: true,
                        borderColor: "neutral200",
                        background: "neutral150",
                        justifyContent: "space-between",
                        children: [
                            /*#__PURE__*/ jsx(Box, {
                                minWidth: 0,
                                paddingTop: 1,
                                paddingBottom: 1,
                                paddingRight: 4,
                                children: /*#__PURE__*/ jsx(Tooltip, {
                                    label: label,
                                    children: isAdminUserRelation ? /*#__PURE__*/ jsx(Typography, {
                                        children: label
                                    }) : /*#__PURE__*/ jsx(LinkEllipsis, {
                                        tag: NavLink,
                                        to: href,
                                        children: label
                                    })
                                })
                            }),
                            /*#__PURE__*/ jsx(DocumentStatus, {
                                status: relationData.status
                            })
                        ]
                    }, relationData.documentId ?? relationData.id);
                })
            }),
            meta.missingCount > 0 && /* @ts-expect-error – we dont need closeLabel */ /*#__PURE__*/ jsx(StyledAlert, {
                marginTop: 1,
                variant: "warning",
                title: formatMessage({
                    id: 'content-manager.history.content.missing-relations.title',
                    defaultMessage: '{number, plural, =1 {Missing relation} other {{number} missing relations}}'
                }, {
                    number: meta.missingCount
                }),
                children: formatMessage({
                    id: 'content-manager.history.content.missing-relations.message',
                    defaultMessage: "{number, plural, =1 {It has} other {They have}} been deleted and can't be restored."
                }, {
                    number: meta.missingCount
                })
            })
        ]
    });
};
/* -------------------------------------------------------------------------------------------------
 * CustomMediaInput
 * -----------------------------------------------------------------------------------------------*/ //  Create an object with value at key path (i.e. 'a.b.c')
const createInitialValuesForPath = (keyPath, value)=>{
    const keys = keyPath.split('.');
    // The root level object
    const root = {};
    // Make the first node the root
    let node = root;
    keys.forEach((key, index)=>{
        // Skip prototype pollution keys
        if (key === '__proto__' || key === 'constructor') return;
        // If it's the last key, set the node value
        if (index === keys.length - 1) {
            node[key] = value;
        } else {
            // Ensure the key exists and is an object
            node[key] = node[key] || {};
        }
        // Traverse down the tree
        node = node[key];
    });
    return root;
};
const CustomMediaInput = (props)=>{
    const { value } = useField(props.name);
    const results = value?.results ?? [];
    const meta = value?.meta ?? {
        missingCount: 0
    };
    const { formatMessage } = useIntl();
    const fields = useStrapiApp('CustomMediaInput', (state)=>state.fields);
    const MediaLibrary = fields.media;
    return /*#__PURE__*/ jsxs(Flex, {
        direction: "column",
        gap: 2,
        alignItems: "stretch",
        children: [
            /*#__PURE__*/ jsx(Form, {
                method: "PUT",
                disabled: true,
                initialValues: createInitialValuesForPath(props.name, results),
                children: /*#__PURE__*/ jsx(MediaLibrary, {
                    ...props,
                    disabled: true,
                    multiple: results.length > 1
                })
            }),
            meta.missingCount > 0 && /*#__PURE__*/ jsx(StyledAlert, {
                variant: "warning",
                closeLabel: "Close",
                onClose: ()=>{},
                title: formatMessage({
                    id: 'content-manager.history.content.missing-assets.title',
                    defaultMessage: '{number, plural, =1 {Missing asset} other {{number} missing assets}}'
                }, {
                    number: meta.missingCount
                }),
                children: formatMessage({
                    id: 'content-manager.history.content.missing-assets.message',
                    defaultMessage: "{number, plural, =1 {It has} other {They have}} been deleted in the Media Library and can't be restored."
                }, {
                    number: meta.missingCount
                })
            })
        ]
    });
};
/**
 * Checks if the i18n plugin added a label action to the field and modifies it
 * to adapt the wording for the history page.
 */ const getLabelAction = (labelAction)=>{
    if (!/*#__PURE__*/ React.isValidElement(labelAction)) {
        return labelAction;
    }
    // TODO: find a better way to do this rather than access internals
    const labelActionTitleId = labelAction.props.title.id;
    if (labelActionTitleId === 'i18n.Field.localized') {
        return /*#__PURE__*/ React.cloneElement(labelAction, {
            ...labelAction.props,
            title: {
                id: 'history.content.localized',
                defaultMessage: 'This value is specific to this locale. If you restore this version, the content will not be replaced for other locales.'
            }
        });
    }
    if (labelActionTitleId === 'i18n.Field.not-localized') {
        return /*#__PURE__*/ React.cloneElement(labelAction, {
            ...labelAction.props,
            title: {
                id: 'history.content.not-localized',
                defaultMessage: 'This value is common to all locales. If you restore this version and save the changes, the content will be replaced for all locales.'
            }
        });
    }
    // Label action is unrelated to i18n, don't touch it.
    return labelAction;
};
/**
 * @internal
 *
 * @description An abstraction around the regular form input renderer designed specifically
 * to be used on the History page in the content-manager. It understands how to render specific
 * inputs within the context of a history version (i.e. relations, media, ignored RBAC, etc...)
 */ const VersionInputRenderer = ({ visible, hint: providedHint, shouldIgnoreRBAC = false, labelAction, ...props })=>{
    const customLabelAction = getLabelAction(labelAction);
    const { formatMessage } = useIntl();
    const version = useHistoryContext('VersionContent', (state)=>state.selectedVersion);
    const configuration = useHistoryContext('VersionContent', (state)=>state.configuration);
    const fieldSizes = useTypedSelector((state)=>state['content-manager'].app.fieldSizes);
    const { id, components } = useDoc();
    const isFormDisabled = useForm('InputRenderer', (state)=>state.disabled);
    const isInDynamicZone = useDynamicZone('isInDynamicZone', (state)=>state.isInDynamicZone);
    const canCreateFields = useDocumentRBAC('InputRenderer', (rbac)=>rbac.canCreateFields);
    const canReadFields = useDocumentRBAC('InputRenderer', (rbac)=>rbac.canReadFields);
    const canUpdateFields = useDocumentRBAC('InputRenderer', (rbac)=>rbac.canUpdateFields);
    const canUserAction = useDocumentRBAC('InputRenderer', (rbac)=>rbac.canUserAction);
    const editableFields = id ? canUpdateFields : canCreateFields;
    const readableFields = id ? canReadFields : canCreateFields;
    /**
   * Component fields are always readable and editable,
   * however the fields within them may not be.
   */ const canUserReadField = canUserAction(props.name, readableFields, props.type);
    const canUserEditField = canUserAction(props.name, editableFields, props.type);
    const fields = useStrapiApp('InputRenderer', (app)=>app.fields);
    const { lazyComponentStore } = useLazyComponents(attributeHasCustomFieldProperty(props.attribute) ? [
        props.attribute.customField
    ] : undefined);
    const hint = useFieldHint(providedHint, props.attribute);
    const { edit: { components: componentsLayout } } = useDocLayout();
    if (!visible) {
        return null;
    }
    /**
   * Don't render the field if the user can't read it.
   */ if (!shouldIgnoreRBAC && !canUserReadField && !isInDynamicZone) {
        return /*#__PURE__*/ jsx(NotAllowedInput, {
            hint: hint,
            ...props
        });
    }
    const fieldIsDisabled = !canUserEditField && !isInDynamicZone || props.disabled || isFormDisabled;
    /**
   * Attributes found on the current content-type schema cannot be restored. We handle
   * this by displaying a warning alert to the user instead of the input for that field type.
   */ const addedAttributes = version.meta.unknownAttributes.added;
    if (Object.keys(addedAttributes).includes(props.name)) {
        return /*#__PURE__*/ jsxs(Flex, {
            direction: "column",
            alignItems: "flex-start",
            gap: 1,
            children: [
                /*#__PURE__*/ jsx(Field.Label, {
                    children: props.label
                }),
                /*#__PURE__*/ jsx(StyledAlert, {
                    width: "100%",
                    closeLabel: "Close",
                    onClose: ()=>{},
                    variant: "warning",
                    title: formatMessage({
                        id: 'content-manager.history.content.new-field.title',
                        defaultMessage: 'New field'
                    }),
                    children: formatMessage({
                        id: 'content-manager.history.content.new-field.message',
                        defaultMessage: "This field didn't exist when this version was saved. If you restore this version, it will be empty."
                    })
                })
            ]
        });
    }
    /**
   * Because a custom field has a unique prop but the type could be confused with either
   * the useField hook or the type of the field we need to handle it separately and first.
   */ if (attributeHasCustomFieldProperty(props.attribute)) {
        const CustomInput = lazyComponentStore[props.attribute.customField];
        if (CustomInput) {
            return /*#__PURE__*/ jsx(CustomInput, {
                ...props,
                // @ts-expect-error – TODO: fix this type error in the useLazyComponents hook.
                hint: hint,
                labelAction: customLabelAction,
                disabled: fieldIsDisabled
            });
        }
        return /*#__PURE__*/ jsx(InputRenderer, {
            ...props,
            hint: hint,
            labelAction: customLabelAction,
            // @ts-expect-error – this workaround lets us display that the custom field is missing.
            type: props.attribute.customField,
            disabled: fieldIsDisabled
        });
    }
    /**
   * Since media fields use a custom input via the upload plugin provided by the useLibrary hook,
   * we need to handle the them before other custom inputs coming from the useLibrary hook.
   */ if (props.type === 'media') {
        return /*#__PURE__*/ jsx(CustomMediaInput, {
            ...props,
            labelAction: customLabelAction,
            disabled: fieldIsDisabled
        });
    }
    /**
   * This is where we handle ONLY the fields from the `useLibrary` hook.
   */ const addedInputTypes = Object.keys(fields);
    if (!attributeHasCustomFieldProperty(props.attribute) && addedInputTypes.includes(props.type)) {
        const CustomInput = fields[props.type];
        return /*#__PURE__*/ jsx(CustomInput, {
            ...props,
            // @ts-expect-error – TODO: fix this type error in the useLibrary hook.
            hint: hint,
            labelAction: customLabelAction,
            disabled: fieldIsDisabled
        });
    }
    /**
   * These include the content-manager specific fields, failing that we fall back
   * to the more generic form input renderer.
   */ switch(props.type){
        case 'blocks':
            return /*#__PURE__*/ jsx(MemoizedBlocksInput, {
                ...props,
                hint: hint,
                type: props.type,
                disabled: fieldIsDisabled
            });
        case 'component':
            const { layout } = componentsLayout[props.attribute.component];
            // Components can only have one panel, so only save the first layout item
            const [remainingFieldsLayout] = getRemaingFieldsLayout({
                layout: [
                    layout
                ],
                metadatas: configuration.components[props.attribute.component].metadatas,
                fieldSizes,
                schemaAttributes: components[props.attribute.component].attributes
            });
            return /*#__PURE__*/ jsx(MemoizedComponentInput, {
                ...props,
                layout: [
                    ...layout,
                    ...remainingFieldsLayout || []
                ],
                hint: hint,
                labelAction: customLabelAction,
                disabled: fieldIsDisabled,
                children: (inputProps)=>/*#__PURE__*/ jsx(VersionInputRenderer, {
                        ...inputProps,
                        shouldIgnoreRBAC: true
                    })
            });
        case 'dynamiczone':
            return /*#__PURE__*/ jsx(DynamicZone, {
                ...props,
                hint: hint,
                labelAction: customLabelAction,
                disabled: fieldIsDisabled,
                children: (inputProps)=>/*#__PURE__*/ jsx(VersionInputRenderer, {
                        ...inputProps,
                        shouldIgnoreRBAC: true
                    })
            });
        case 'relation':
            return /*#__PURE__*/ jsx(CustomRelationInput, {
                ...props,
                hint: hint,
                labelAction: customLabelAction,
                disabled: fieldIsDisabled
            });
        case 'richtext':
            return /*#__PURE__*/ jsx(MemoizedWysiwyg, {
                ...props,
                hint: hint,
                type: props.type,
                labelAction: customLabelAction,
                disabled: fieldIsDisabled
            });
        case 'uid':
            return /*#__PURE__*/ jsx(MemoizedUIDInput, {
                ...props,
                hint: hint,
                type: props.type,
                labelAction: customLabelAction,
                disabled: fieldIsDisabled
            });
        /**
     * Enumerations are a special case because they require options.
     */ case 'enumeration':
            return /*#__PURE__*/ jsx(InputRenderer, {
                ...props,
                hint: hint,
                labelAction: customLabelAction,
                options: props.attribute.enum.map((value)=>({
                        value
                    })),
                // @ts-expect-error – Temp workaround so we don't forget custom-fields don't work!
                type: props.customField ? 'custom-field' : props.type,
                disabled: fieldIsDisabled
            });
        default:
            // These props are not needed for the generic form input renderer.
            const { unique: _unique, mainField: _mainField, ...restProps } = props;
            return /*#__PURE__*/ jsx(InputRenderer, {
                ...restProps,
                hint: hint,
                labelAction: customLabelAction,
                // @ts-expect-error – Temp workaround so we don't forget custom-fields don't work!
                type: props.customField ? 'custom-field' : props.type,
                disabled: fieldIsDisabled
            });
    }
};
const attributeHasCustomFieldProperty = (attribute)=>'customField' in attribute && typeof attribute.customField === 'string';

export { VersionInputRenderer };
//# sourceMappingURL=VersionInputRenderer.mjs.map
