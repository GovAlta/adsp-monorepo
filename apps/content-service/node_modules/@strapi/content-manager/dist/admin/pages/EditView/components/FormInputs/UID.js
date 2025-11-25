'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var strapiAdmin = require('@strapi/admin/strapi-admin');
var designSystem = require('@strapi/design-system');
var Icons = require('@strapi/icons');
var reactIntl = require('react-intl');
var reactRouterDom = require('react-router-dom');
var styledComponents = require('styled-components');
var useDebounce = require('../../../../hooks/useDebounce.js');
var useDocumentContext = require('../../../../hooks/useDocumentContext.js');
var router = require('../../../../router.js');
var uid = require('../../../../services/uid.js');
var api = require('../../../../utils/api.js');

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

/* -------------------------------------------------------------------------------------------------
 * InputUID
 * -----------------------------------------------------------------------------------------------*/ const UID_REGEX = /^[A-Za-z0-9-_.~]*$/;
const UIDInput = /*#__PURE__*/ React__namespace.forwardRef(({ hint, label, labelAction, name, required, attribute = {}, ...props }, ref)=>{
    const { currentDocumentMeta } = useDocumentContext.useDocumentContext('UIDInput');
    const allFormValues = strapiAdmin.useForm('InputUID', (form)=>form.values);
    const [availability, setAvailability] = React__namespace.useState();
    const [showRegenerate, setShowRegenerate] = React__namespace.useState(false);
    const isCloning = reactRouterDom.useMatch(router.CLONE_PATH) !== null;
    const field = strapiAdmin.useField(name);
    const debouncedValue = useDebounce.useDebounce(field.value, 300);
    const hasChanged = debouncedValue !== field.initialValue;
    const { toggleNotification } = strapiAdmin.useNotification();
    const { _unstableFormatAPIError: formatAPIError } = strapiAdmin.useAPIErrorHandler();
    const { formatMessage } = reactIntl.useIntl();
    const [{ query }] = strapiAdmin.useQueryParams();
    const params = React__namespace.useMemo(()=>api.buildValidParams(query), [
        query
    ]);
    const { regex } = attribute;
    const validationRegExp = regex ? new RegExp(regex) : UID_REGEX;
    const { data: defaultGeneratedUID, isLoading: isGeneratingDefaultUID, error: apiError } = uid.useGetDefaultUIDQuery({
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
    React__namespace.useEffect(()=>{
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
     */ React__namespace.useEffect(()=>{
        if (defaultGeneratedUID && field.value === undefined) {
            field.onChange(name, defaultGeneratedUID);
        }
    }, [
        defaultGeneratedUID,
        field,
        name
    ]);
    const [generateUID, { isLoading: isGeneratingUID }] = uid.useGenerateUIDMutation();
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
    const { data: availabilityData, isLoading: isCheckingAvailability, error: availabilityError } = uid.useGetAvailabilityQuery({
        contentTypeUID: currentDocumentMeta.model,
        field: name,
        value: debouncedValue ? debouncedValue.trim() : '',
        params
    }, {
        // Don't check availability if the value is empty or wasn't changed
        skip: !Boolean((hasChanged || isCloning) && debouncedValue && validationRegExp.test(debouncedValue.trim()))
    });
    React__namespace.useEffect(()=>{
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
    React__namespace.useEffect(()=>{
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
    const fieldRef = strapiAdmin.useFocusInputField(name);
    const composedRefs = designSystem.useComposedRefs(ref, fieldRef);
    const shouldShowAvailability = (hasChanged || isCloning) && debouncedValue != null && availability && !showRegenerate;
    return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Field.Root, {
        hint: hint,
        name: name,
        error: field.error,
        required: required,
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Label, {
                action: labelAction,
                children: label
            }),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.TextInput, {
                ref: composedRefs,
                disabled: props.disabled,
                endAction: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                    position: "relative",
                    gap: 1,
                    children: [
                        shouldShowAvailability && /*#__PURE__*/ jsxRuntime.jsxs(TextValidation, {
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
                                availability?.isAvailable ? /*#__PURE__*/ jsxRuntime.jsx(Icons.CheckCircle, {}) : /*#__PURE__*/ jsxRuntime.jsx(Icons.WarningCircle, {}),
                                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
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
                        !props.disabled && /*#__PURE__*/ jsxRuntime.jsxs(jsxRuntime.Fragment, {
                            children: [
                                showRegenerate && /*#__PURE__*/ jsxRuntime.jsx(TextValidation, {
                                    alignItems: "center",
                                    justifyContent: "flex-end",
                                    gap: 1,
                                    children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                        textColor: "primary600",
                                        variant: "pi",
                                        children: formatMessage({
                                            id: 'content-manager.components.uid.regenerate',
                                            defaultMessage: 'Regenerate'
                                        })
                                    })
                                }),
                                /*#__PURE__*/ jsxRuntime.jsx(FieldActionWrapper, {
                                    onClick: handleRegenerateClick,
                                    label: formatMessage({
                                        id: 'content-manager.components.uid.regenerate',
                                        defaultMessage: 'Regenerate'
                                    }),
                                    onMouseEnter: ()=>setShowRegenerate(true),
                                    onMouseLeave: ()=>setShowRegenerate(false),
                                    children: isLoading ? /*#__PURE__*/ jsxRuntime.jsx(LoadingWrapper, {
                                        "data-testid": "loading-wrapper",
                                        children: /*#__PURE__*/ jsxRuntime.jsx(Icons.Loader, {})
                                    }) : /*#__PURE__*/ jsxRuntime.jsx(Icons.ArrowClockwise, {})
                                })
                            ]
                        })
                    ]
                }),
                onChange: field.onChange,
                value: field.value ?? '',
                ...props
            }),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Error, {}),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Hint, {})
        ]
    });
});
/* -------------------------------------------------------------------------------------------------
 * FieldActionWrapper
 * -----------------------------------------------------------------------------------------------*/ const FieldActionWrapper = styledComponents.styled(designSystem.Field.Action)`
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
 * -----------------------------------------------------------------------------------------------*/ const TextValidation = styledComponents.styled(designSystem.Flex)`
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
 * -----------------------------------------------------------------------------------------------*/ const rotation = styledComponents.keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(359deg);
  }
`;
const LoadingWrapper = styledComponents.styled(designSystem.Flex)`
  animation: ${rotation} 2s infinite linear;
`;
const MemoizedUIDInput = /*#__PURE__*/ React__namespace.memo(UIDInput);

exports.UIDInput = MemoizedUIDInput;
//# sourceMappingURL=UID.js.map
