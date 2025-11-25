'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var designSystem = require('@strapi/design-system');
var icons = require('@strapi/icons');
var fractionalIndexing = require('fractional-indexing');
var immer = require('immer');
var isEqual = require('lodash/isEqual');
var reactIntl = require('react-intl');
var reactRouterDom = require('react-router-dom');
var objects = require('../utils/objects.js');
var Context = require('./Context.js');

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

/**
 * @internal
 * @description We use this just to warn people that they're using the useForm
 * methods outside of a Form component, but we don't want to throw an error
 * because otherwise the DocumentActions list cannot be rendered in our list-view.
 */ const ERR_MSG = 'The Form Component has not been initialised, ensure you are using this hook within a Form component';
const [FormProvider, useForm] = Context.createContext('Form', {
    disabled: false,
    errors: {},
    initialValues: {},
    isSubmitting: false,
    modified: false,
    addFieldRow: ()=>{
        throw new Error(ERR_MSG);
    },
    moveFieldRow: ()=>{
        throw new Error(ERR_MSG);
    },
    onChange: ()=>{
        throw new Error(ERR_MSG);
    },
    removeFieldRow: ()=>{
        throw new Error(ERR_MSG);
    },
    resetForm: ()=>{
        throw new Error(ERR_MSG);
    },
    setErrors: ()=>{
        throw new Error(ERR_MSG);
    },
    setValues: ()=>{
        throw new Error(ERR_MSG);
    },
    setSubmitting: ()=>{
        throw new Error(ERR_MSG);
    },
    validate: async ()=>{
        throw new Error(ERR_MSG);
    },
    values: {}
});
/**
 * @alpha
 * @description A form component that handles form state, validation and submission.
 * It can additionally handle nested fields and arrays. To access the data you can either
 * use the generic useForm hook or the useField hook when providing the name of your field.
 */ const Form = /*#__PURE__*/ React__namespace.forwardRef(({ disabled = false, method, onSubmit, initialErrors, ...props }, ref)=>{
    const formRef = React__namespace.useRef(null);
    const initialValues = React__namespace.useRef(props.initialValues ?? {});
    const [state, dispatch] = React__namespace.useReducer(reducer, {
        errors: initialErrors ?? {},
        isSubmitting: false,
        values: props.initialValues ?? {}
    });
    React__namespace.useEffect(()=>{
        /**
       * ONLY update the initialValues if the prop has changed.
       */ if (!isEqual(initialValues.current, props.initialValues)) {
            initialValues.current = props.initialValues ?? {};
            dispatch({
                type: 'SET_INITIAL_VALUES',
                payload: props.initialValues ?? {}
            });
        }
    }, [
        props.initialValues
    ]);
    const setErrors = React__namespace.useCallback((errors)=>{
        dispatch({
            type: 'SET_ERRORS',
            payload: errors
        });
    }, []);
    const setValues = React__namespace.useCallback((values)=>{
        dispatch({
            type: 'SET_VALUES',
            payload: values
        });
    }, []);
    React__namespace.useEffect(()=>{
        if (Object.keys(state.errors).length === 0) return;
        /**
       * Small timeout to ensure the form has been
       * rendered before we try to focus on the first
       */ const ref = setTimeout(()=>{
            const [firstError] = formRef.current.querySelectorAll('[data-strapi-field-error]');
            if (firstError) {
                const errorId = firstError.getAttribute('id');
                const formElementInError = formRef.current.querySelector(`[aria-describedby="${errorId}"]`);
                if (formElementInError && formElementInError instanceof HTMLElement) {
                    formElementInError.focus();
                }
            }
        });
        return ()=>clearTimeout(ref);
    }, [
        state.errors
    ]);
    /**
     * Uses the provided validation schema
     */ const validate = React__namespace.useCallback(async (shouldSetErrors = true, options = {})=>{
        setErrors({});
        if (!props.validationSchema && !props.validate) {
            return {
                data: state.values
            };
        }
        try {
            let data;
            if (props.validationSchema) {
                data = await props.validationSchema.validate(state.values, {
                    abortEarly: false
                });
            } else if (props.validate) {
                data = await props.validate(state.values, options);
            } else {
                throw new Error('No validation schema or validate function provided');
            }
            return {
                data
            };
        } catch (err) {
            if (isErrorYupValidationError(err)) {
                const errors = getYupValidationErrors(err);
                if (shouldSetErrors) {
                    setErrors(errors);
                }
                return {
                    errors
                };
            } else {
                // We throw any other errors
                if (process.env.NODE_ENV !== 'production') {
                    console.warn(`Warning: An unhandled error was caught during validation in <Form validationSchema />`, err);
                }
                throw err;
            }
        }
    }, [
        props,
        setErrors,
        state.values
    ]);
    const handleSubmit = async (e)=>{
        e.stopPropagation();
        e.preventDefault();
        if (!onSubmit) {
            return;
        }
        dispatch({
            type: 'SUBMIT_ATTEMPT'
        });
        try {
            const { data, errors } = await validate();
            if (errors) {
                setErrors(errors);
                throw new Error('Submission failed');
            }
            await onSubmit(data, {
                setErrors,
                setValues,
                resetForm
            });
            dispatch({
                type: 'SUBMIT_SUCCESS'
            });
        } catch (err) {
            dispatch({
                type: 'SUBMIT_FAILURE'
            });
            if (err instanceof Error && err.message === 'Submission failed') {
                return;
            }
        }
    };
    const modified = React__namespace.useMemo(()=>!isEqual(initialValues.current, state.values), [
        state.values
    ]);
    const handleChange = designSystem.useCallbackRef((eventOrPath, v)=>{
        if (typeof eventOrPath === 'string') {
            dispatch({
                type: 'SET_FIELD_VALUE',
                payload: {
                    field: eventOrPath,
                    value: v
                }
            });
            return;
        }
        const target = eventOrPath.target || eventOrPath.currentTarget;
        const { type, name, id, value, options, multiple } = target;
        const field = name || id;
        if (!field && process.env.NODE_ENV !== 'production') {
            console.warn(`\`onChange\` was called with an event, but you forgot to pass a \`name\` or \`id'\` attribute to your input. The field to update cannot be determined`);
        }
        /**
       * Because we handle any field from this function, we run through a series
       * of checks to understand how to use the value.
       */ let val;
        if (/number|range/.test(type)) {
            const parsed = parseFloat(value);
            // If the value isn't a number for whatever reason, don't let it through because that will break the API.
            val = isNaN(parsed) ? '' : parsed;
        } else if (/checkbox/.test(type)) {
            // Get & invert the current value of the checkbox.
            val = !objects.getIn(state.values, field);
        } else if (options && multiple) {
            // This will handle native select elements incl. ones with mulitple options.
            val = Array.from(options).filter((el)=>el.selected).map((el)=>el.value);
        } else {
            // NOTE: reset value to null so it failes required checks.
            // The API only considers a required field invalid if the value is null|undefined, to differentiate from min 1
            if (value === '') {
                val = null;
            } else {
                val = value;
            }
        }
        if (field) {
            dispatch({
                type: 'SET_FIELD_VALUE',
                payload: {
                    field,
                    value: val
                }
            });
        }
    });
    const addFieldRow = React__namespace.useCallback((field, value, addAtIndex)=>{
        dispatch({
            type: 'ADD_FIELD_ROW',
            payload: {
                field,
                value,
                addAtIndex
            }
        });
    }, []);
    const removeFieldRow = React__namespace.useCallback((field, removeAtIndex)=>{
        dispatch({
            type: 'REMOVE_FIELD_ROW',
            payload: {
                field,
                removeAtIndex
            }
        });
    }, []);
    const moveFieldRow = React__namespace.useCallback((field, fromIndex, toIndex)=>{
        dispatch({
            type: 'MOVE_FIELD_ROW',
            payload: {
                field,
                fromIndex,
                toIndex
            }
        });
    }, []);
    const resetForm = React__namespace.useCallback(()=>{
        dispatch({
            type: 'RESET_FORM',
            payload: {
                errors: {},
                isSubmitting: false,
                values: initialValues.current
            }
        });
    }, []);
    const setSubmitting = React__namespace.useCallback((isSubmitting)=>{
        dispatch({
            type: 'SET_ISSUBMITTING',
            payload: isSubmitting
        });
    }, []);
    const composedRefs = designSystem.useComposedRefs(formRef, ref);
    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
        tag: "form",
        ref: composedRefs,
        method: method,
        noValidate: true,
        onSubmit: handleSubmit,
        width: props.width,
        height: props.height,
        children: /*#__PURE__*/ jsxRuntime.jsx(FormProvider, {
            disabled: disabled,
            onChange: handleChange,
            initialValues: initialValues.current,
            modified: modified,
            addFieldRow: addFieldRow,
            moveFieldRow: moveFieldRow,
            removeFieldRow: removeFieldRow,
            resetForm: resetForm,
            setErrors: setErrors,
            setValues: setValues,
            setSubmitting: setSubmitting,
            validate: validate,
            ...state,
            children: typeof props.children === 'function' ? props.children({
                modified,
                disabled,
                onChange: handleChange,
                ...state,
                setErrors,
                resetForm
            }) : props.children
        })
    });
}); // we've cast this because we need the generic to infer the type of the form values.
/**
 * @internal
 * @description Checks if the error is a Yup validation error.
 */ const isErrorYupValidationError = (err)=>typeof err === 'object' && err !== null && 'name' in err && typeof err.name === 'string' && err.name === 'ValidationError';
/* -------------------------------------------------------------------------------------------------
 * getYupValidationErrors
 * -----------------------------------------------------------------------------------------------*/ /**
 * @description handy utility to convert a yup validation error into a form
 * error object. To be used elsewhere.
 */ const getYupValidationErrors = (err)=>{
    let errors = {};
    if (err.inner) {
        if (err.inner.length === 0) {
            return objects.setIn(errors, err.path, err.message);
        }
        for (const error of err.inner){
            if (!objects.getIn(errors, error.path)) {
                errors = objects.setIn(errors, error.path, error.message);
            }
        }
    }
    return errors;
};
const reducer = (state, action)=>immer.produce(state, (draft)=>{
        switch(action.type){
            case 'SET_INITIAL_VALUES':
                // @ts-expect-error – TODO: figure out why this fails ts.
                draft.values = action.payload;
                break;
            case 'SET_VALUES':
                // @ts-expect-error – TODO: figure out why this fails ts.
                draft.values = action.payload;
                break;
            case 'SUBMIT_ATTEMPT':
                draft.isSubmitting = true;
                break;
            case 'SUBMIT_FAILURE':
                draft.isSubmitting = false;
                break;
            case 'SUBMIT_SUCCESS':
                draft.isSubmitting = false;
                break;
            case 'SET_FIELD_VALUE':
                draft.values = objects.setIn(state.values, action.payload.field, action.payload.value);
                break;
            case 'ADD_FIELD_ROW':
                {
                    /**
         * TODO: add check for if the field is an array?
         */ const currentField = objects.getIn(state.values, action.payload.field, []);
                    let position = action.payload.addAtIndex;
                    if (position === undefined) {
                        position = currentField.length;
                    } else if (position < 0) {
                        position = 0;
                    }
                    const [key] = fractionalIndexing.generateNKeysBetween(position > 0 ? currentField.at(position - 1)?.__temp_key__ : null, currentField.at(position)?.__temp_key__, 1);
                    draft.values = objects.setIn(state.values, action.payload.field, currentField.toSpliced(position, 0, {
                        ...action.payload.value,
                        __temp_key__: key
                    }));
                    break;
                }
            case 'MOVE_FIELD_ROW':
                {
                    const { field, fromIndex, toIndex } = action.payload;
                    /**
         * TODO: add check for if the field is an array?
         */ const currentField = [
                        ...objects.getIn(state.values, field, [])
                    ];
                    const currentRow = currentField[fromIndex];
                    const startKey = fromIndex > toIndex ? currentField[toIndex - 1]?.__temp_key__ : currentField[toIndex]?.__temp_key__;
                    const endKey = fromIndex > toIndex ? currentField[toIndex]?.__temp_key__ : currentField[toIndex + 1]?.__temp_key__;
                    const [newKey] = fractionalIndexing.generateNKeysBetween(startKey, endKey, 1);
                    currentField.splice(fromIndex, 1);
                    currentField.splice(toIndex, 0, {
                        ...currentRow,
                        __temp_key__: newKey
                    });
                    draft.values = objects.setIn(state.values, field, currentField);
                    break;
                }
            case 'REMOVE_FIELD_ROW':
                {
                    /**
         * TODO: add check for if the field is an array?
         */ const currentField = objects.getIn(state.values, action.payload.field, []);
                    let position = action.payload.removeAtIndex;
                    if (position === undefined) {
                        position = currentField.length - 1;
                    } else if (position < 0) {
                        position = 0;
                    }
                    /**
         * filter out empty values from the array, the setIn function only deletes the value
         * when we pass undefined as opposed to "removing" it from said array.
         */ const newValue = objects.setIn(currentField, position.toString(), undefined).filter((val)=>val);
                    draft.values = objects.setIn(state.values, action.payload.field, newValue.length > 0 ? newValue : []);
                    break;
                }
            case 'SET_ERRORS':
                if (!isEqual(state.errors, action.payload)) {
                    // @ts-expect-error – TODO: figure out why this fails a TS check.
                    draft.errors = action.payload;
                }
                break;
            case 'SET_ISSUBMITTING':
                draft.isSubmitting = action.payload;
                break;
            case 'RESET_FORM':
                // @ts-expect-error – TODO: figure out why this fails ts.
                draft.values = action.payload.values;
                // @ts-expect-error – TODO: figure out why this fails ts.
                draft.errors = action.payload.errors;
                draft.isSubmitting = action.payload.isSubmitting;
                break;
        }
    });
function useField(path) {
    const { formatMessage } = reactIntl.useIntl();
    const initialValue = useForm('useField', (state)=>objects.getIn(state.initialValues, path));
    const value = useForm('useField', (state)=>objects.getIn(state.values, path));
    const handleChange = useForm('useField', (state)=>state.onChange);
    const rawError = useForm('useField', (state)=>objects.getIn(state.errors, path));
    const error = useForm('useField', (state)=>{
        const error = objects.getIn(state.errors, path);
        if (isErrorMessageDescriptor(error)) {
            const { values, ...message } = error;
            return formatMessage(message, values);
        }
        return error;
    });
    return {
        initialValue,
        /**
     * Errors can be a string, or a MessageDescriptor, so we need to handle both cases.
     * If it's anything else, we don't return it.
     */ rawError,
        error: isErrorMessageDescriptor(error) ? formatMessage({
            id: error.id,
            defaultMessage: error.defaultMessage
        }, error.values) : typeof error === 'string' ? error : undefined,
        onChange: handleChange,
        value: value
    };
}
const isErrorMessageDescriptor = (object)=>{
    return typeof object === 'object' && object !== null && !Array.isArray(object) && 'id' in object && 'defaultMessage' in object;
};
/* -------------------------------------------------------------------------------------------------
 * Blocker
 * -----------------------------------------------------------------------------------------------*/ const Blocker = ({ onProceed = ()=>{}, onCancel = ()=>{} })=>{
    const { formatMessage } = reactIntl.useIntl();
    const modified = useForm('Blocker', (state)=>state.modified);
    const isSubmitting = useForm('Blocker', (state)=>state.isSubmitting);
    const blocker = reactRouterDom.useBlocker(({ currentLocation, nextLocation })=>{
        return !isSubmitting && modified && (currentLocation.pathname !== nextLocation.pathname || currentLocation.search !== nextLocation.search);
    });
    if (blocker.state === 'blocked') {
        const handleCancel = (isOpen)=>{
            if (!isOpen) {
                onCancel();
                blocker.reset();
            }
        };
        return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Dialog.Root, {
            open: true,
            onOpenChange: handleCancel,
            children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Dialog.Content, {
                children: [
                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Dialog.Header, {
                        children: formatMessage({
                            id: 'app.components.ConfirmDialog.title',
                            defaultMessage: 'Confirmation'
                        })
                    }),
                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Dialog.Body, {
                        icon: /*#__PURE__*/ jsxRuntime.jsx(icons.WarningCircle, {
                            width: "24px",
                            height: "24px",
                            fill: "danger600"
                        }),
                        children: formatMessage({
                            id: 'global.prompt.unsaved',
                            defaultMessage: 'You have unsaved changes, are you sure you want to leave?'
                        })
                    }),
                    /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Dialog.Footer, {
                        children: [
                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Dialog.Cancel, {
                                children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Button, {
                                    variant: "tertiary",
                                    children: formatMessage({
                                        id: 'app.components.Button.cancel',
                                        defaultMessage: 'Cancel'
                                    })
                                })
                            }),
                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Button, {
                                onClick: ()=>{
                                    onProceed();
                                    blocker.proceed();
                                },
                                variant: "danger",
                                children: formatMessage({
                                    id: 'app.components.Button.confirm',
                                    defaultMessage: 'Confirm'
                                })
                            })
                        ]
                    })
                ]
            })
        });
    }
    return null;
};

exports.Blocker = Blocker;
exports.Form = Form;
exports.getYupValidationErrors = getYupValidationErrors;
exports.useField = useField;
exports.useForm = useForm;
//# sourceMappingURL=Form.js.map
