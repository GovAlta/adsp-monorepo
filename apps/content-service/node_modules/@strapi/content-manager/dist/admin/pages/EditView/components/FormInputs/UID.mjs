import { jsxs, jsx, Fragment } from 'react/jsx-runtime';
import * as React from 'react';
import { useForm, useField, useNotification, useAPIErrorHandler, useQueryParams, useFocusInputField } from '@strapi/admin/strapi-admin';
import { Field, Flex, useComposedRefs, TextInput, Typography } from '@strapi/design-system';
import { CheckCircle, WarningCircle, Loader, ArrowClockwise } from '@strapi/icons';
import { useIntl } from 'react-intl';
import { useMatch } from 'react-router-dom';
import { styled, keyframes } from 'styled-components';
import { useDebounce } from '../../../../hooks/useDebounce.mjs';
import { useDocumentContext } from '../../../../hooks/useDocumentContext.mjs';
import { CLONE_PATH } from '../../../../router.mjs';
import { useGetDefaultUIDQuery, useGenerateUIDMutation, useGetAvailabilityQuery } from '../../../../services/uid.mjs';
import { buildValidParams } from '../../../../utils/api.mjs';

/* -------------------------------------------------------------------------------------------------
 * InputUID
 * -----------------------------------------------------------------------------------------------*/ const UID_REGEX = /^[A-Za-z0-9-_.~]*$/;
const UIDInput = /*#__PURE__*/ React.forwardRef(({ hint, label, labelAction, name, required, attribute = {}, ...props }, ref)=>{
    const { currentDocumentMeta } = useDocumentContext('UIDInput');
    const allFormValues = useForm('InputUID', (form)=>form.values);
    const [availability, setAvailability] = React.useState();
    const [showRegenerate, setShowRegenerate] = React.useState(false);
    const isCloning = useMatch(CLONE_PATH) !== null;
    const field = useField(name);
    const debouncedValue = useDebounce(field.value, 300);
    const hasChanged = debouncedValue !== field.initialValue;
    const { toggleNotification } = useNotification();
    const { _unstableFormatAPIError: formatAPIError } = useAPIErrorHandler();
    const { formatMessage } = useIntl();
    const [{ query }] = useQueryParams();
    const params = React.useMemo(()=>buildValidParams(query), [
        query
    ]);
    const { regex } = attribute;
    const validationRegExp = regex ? new RegExp(regex) : UID_REGEX;
    const { data: defaultGeneratedUID, isLoading: isGeneratingDefaultUID, error: apiError } = useGetDefaultUIDQuery({
        contentTypeUID: currentDocumentMeta.model,
        field: name,
        data: {
            id: currentDocumentMeta.documentId ?? '',
            ...allFormValues
        },
        params
    }, {
        skip: field.value || !required
    });
    React.useEffect(()=>{
        if (apiError) {
            toggleNotification({
                type: 'warning',
                message: formatAPIError(apiError)
            });
        }
    }, [
        apiError,
        formatAPIError,
        toggleNotification
    ]);
    /**
     * If the defaultGeneratedUID is available, then we set it as the value,
     * but we also want to set it as the initialValue too.
     */ React.useEffect(()=>{
        if (defaultGeneratedUID && field.value === undefined) {
            field.onChange(name, defaultGeneratedUID);
        }
    }, [
        defaultGeneratedUID,
        field,
        name
    ]);
    const [generateUID, { isLoading: isGeneratingUID }] = useGenerateUIDMutation();
    const handleRegenerateClick = async ()=>{
        try {
            const res = await generateUID({
                contentTypeUID: currentDocumentMeta.model,
                field: name,
                data: {
                    id: currentDocumentMeta.documentId ?? '',
                    ...allFormValues
                },
                params
            });
            if ('data' in res) {
                field.onChange(name, res.data);
            } else {
                toggleNotification({
                    type: 'danger',
                    message: formatAPIError(res.error)
                });
            }
        } catch (err) {
            toggleNotification({
                type: 'danger',
                message: formatMessage({
                    id: 'notification.error',
                    defaultMessage: 'An error occurred.'
                })
            });
        }
    };
    const { data: availabilityData, isLoading: isCheckingAvailability, error: availabilityError } = useGetAvailabilityQuery({
        contentTypeUID: currentDocumentMeta.model,
        field: name,
        value: debouncedValue ? debouncedValue.trim() : '',
        params
    }, {
        // Don't check availability if the value is empty or wasn't changed
        skip: !Boolean((hasChanged || isCloning) && debouncedValue && validationRegExp.test(debouncedValue.trim()))
    });
    React.useEffect(()=>{
        if (availabilityError) {
            toggleNotification({
                type: 'warning',
                message: formatAPIError(availabilityError)
            });
        }
    }, [
        availabilityError,
        formatAPIError,
        toggleNotification
    ]);
    React.useEffect(()=>{
        /**
       * always store the data in state because that way as seen below
       * we can then remove the data to stop showing the label.
       */ setAvailability(availabilityData);
        let timer;
        if (availabilityData?.isAvailable) {
            timer = window.setTimeout(()=>{
                setAvailability(undefined);
            }, 4000);
        }
        return ()=>{
            if (timer) {
                clearTimeout(timer);
            }
        };
    }, [
        availabilityData
    ]);
    const isLoading = isGeneratingDefaultUID || isGeneratingUID || isCheckingAvailability;
    const fieldRef = useFocusInputField(name);
    const composedRefs = useComposedRefs(ref, fieldRef);
    const shouldShowAvailability = (hasChanged || isCloning) && debouncedValue != null && availability && !showRegenerate;
    return /*#__PURE__*/ jsxs(Field.Root, {
        hint: hint,
        name: name,
        error: field.error,
        required: required,
        children: [
            /*#__PURE__*/ jsx(Field.Label, {
                action: labelAction,
                children: label
            }),
            /*#__PURE__*/ jsx(TextInput, {
                ref: composedRefs,
                disabled: props.disabled,
                endAction: /*#__PURE__*/ jsxs(Flex, {
                    position: "relative",
                    gap: 1,
                    children: [
                        shouldShowAvailability && /*#__PURE__*/ jsxs(TextValidation, {
                            alignItems: "center",
                            gap: 1,
                            justifyContent: "flex-end",
                            $available: !!availability?.isAvailable,
                            "data-not-here-outer": true,
                            position: "absolute",
                            pointerEvents: "none",
                            right: 6,
                            width: "100px",
                            children: [
                                availability?.isAvailable ? /*#__PURE__*/ jsx(CheckCircle, {}) : /*#__PURE__*/ jsx(WarningCircle, {}),
                                /*#__PURE__*/ jsx(Typography, {
                                    textColor: availability.isAvailable ? 'success600' : 'danger600',
                                    variant: "pi",
                                    children: formatMessage(availability.isAvailable ? {
                                        id: 'content-manager.components.uid.available',
                                        defaultMessage: 'Available'
                                    } : {
                                        id: 'content-manager.components.uid.unavailable',
                                        defaultMessage: 'Unavailable'
                                    })
                                })
                            ]
                        }),
                        !props.disabled && /*#__PURE__*/ jsxs(Fragment, {
                            children: [
                                showRegenerate && /*#__PURE__*/ jsx(TextValidation, {
                                    alignItems: "center",
                                    justifyContent: "flex-end",
                                    gap: 1,
                                    children: /*#__PURE__*/ jsx(Typography, {
                                        textColor: "primary600",
                                        variant: "pi",
                                        children: formatMessage({
                                            id: 'content-manager.components.uid.regenerate',
                                            defaultMessage: 'Regenerate'
                                        })
                                    })
                                }),
                                /*#__PURE__*/ jsx(FieldActionWrapper, {
                                    onClick: handleRegenerateClick,
                                    label: formatMessage({
                                        id: 'content-manager.components.uid.regenerate',
                                        defaultMessage: 'Regenerate'
                                    }),
                                    onMouseEnter: ()=>setShowRegenerate(true),
                                    onMouseLeave: ()=>setShowRegenerate(false),
                                    children: isLoading ? /*#__PURE__*/ jsx(LoadingWrapper, {
                                        "data-testid": "loading-wrapper",
                                        children: /*#__PURE__*/ jsx(Loader, {})
                                    }) : /*#__PURE__*/ jsx(ArrowClockwise, {})
                                })
                            ]
                        })
                    ]
                }),
                onChange: field.onChange,
                value: field.value ?? '',
                ...props
            }),
            /*#__PURE__*/ jsx(Field.Error, {}),
            /*#__PURE__*/ jsx(Field.Hint, {})
        ]
    });
});
/* -------------------------------------------------------------------------------------------------
 * FieldActionWrapper
 * -----------------------------------------------------------------------------------------------*/ const FieldActionWrapper = styled(Field.Action)`
  width: 1.6rem;

  svg {
    height: 1.6rem;
    width: 1.6rem;
    path {
      fill: ${({ theme })=>theme.colors.neutral400};
    }
  }

  svg:hover {
    path {
      fill: ${({ theme })=>theme.colors.primary600};
    }
  }
`;
/* -------------------------------------------------------------------------------------------------
 * TextValidation
 * -----------------------------------------------------------------------------------------------*/ const TextValidation = styled(Flex)`
  svg {
    height: 1.2rem;
    width: 1.2rem;

    path {
      fill: ${({ theme, $available })=>$available ? theme.colors.success600 : theme.colors.danger600};
    }
  }
`;
/* -------------------------------------------------------------------------------------------------
 * LoadingWrapper
 * -----------------------------------------------------------------------------------------------*/ const rotation = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(359deg);
  }
`;
const LoadingWrapper = styled(Flex)`
  animation: ${rotation} 2s infinite linear;
`;
const MemoizedUIDInput = /*#__PURE__*/ React.memo(UIDInput);

export { MemoizedUIDInput as UIDInput };
//# sourceMappingURL=UID.mjs.map
