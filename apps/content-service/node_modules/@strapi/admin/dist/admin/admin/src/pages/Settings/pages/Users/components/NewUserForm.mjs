import { jsx, jsxs, Fragment } from 'react/jsx-runtime';
import * as React from 'react';
import { Modal, Breadcrumbs, Crumb, Flex, Box, Typography, Grid, Button } from '@strapi/design-system';
import { useIntl } from 'react-intl';
import * as yup from 'yup';
import { Form } from '../../../../../components/Form.mjs';
import { InputRenderer as MemoizedInputRenderer } from '../../../../../components/FormInputs/Renderer.mjs';
import { useNotification } from '../../../../../features/Notifications.mjs';
import { useAPIErrorHandler } from '../../../../../hooks/useAPIErrorHandler.mjs';
import { useEnterprise } from '../../../../../hooks/useEnterprise.mjs';
import { useCreateUserMutation } from '../../../../../services/users.mjs';
import { isBaseQueryError } from '../../../../../utils/baseQuery.mjs';
import { translatedErrors as errorsTrads } from '../../../../../utils/translatedErrors.mjs';
import { MagicLinkCE } from './MagicLinkCE.mjs';
import { SelectRoles } from './SelectRoles.mjs';

const ModalForm = ({ onToggle })=>{
    const [currentStep, setStep] = React.useState('create');
    const [registrationToken, setRegistrationToken] = React.useState('');
    const { formatMessage } = useIntl();
    const { toggleNotification } = useNotification();
    const { _unstableFormatAPIError: formatAPIError, _unstableFormatValidationErrors: formatValidationErrors } = useAPIErrorHandler();
    const roleLayout = useEnterprise(ROLE_LAYOUT, async ()=>(await import('../../../../../../../ee/admin/src/pages/SettingsPage/pages/Users/components/ModalForm.mjs')).ROLE_LAYOUT, {
        combine (ceRoles, eeRoles) {
            return [
                ...ceRoles,
                ...eeRoles
            ];
        },
        defaultValue: []
    });
    const initialValues = useEnterprise(FORM_INITIAL_VALUES, async ()=>(await import('../../../../../../../ee/admin/src/pages/SettingsPage/pages/Users/components/ModalForm.mjs')).FORM_INITIAL_VALUES, {
        combine (ceValues, eeValues) {
            return {
                ...ceValues,
                ...eeValues
            };
        },
        defaultValue: FORM_INITIAL_VALUES
    });
    const MagicLink = useEnterprise(MagicLinkCE, async ()=>(await import('../../../../../../../ee/admin/src/pages/SettingsPage/pages/Users/components/MagicLinkEE.mjs')).MagicLinkEE);
    const [createUser] = useCreateUserMutation();
    const headerTitle = formatMessage({
        id: 'Settings.permissions.users.create',
        defaultMessage: 'Invite new user'
    });
    const handleSubmit = async (body, { setErrors })=>{
        const res = await createUser({
            ...body,
            roles: body.roles ?? []
        });
        if ('data' in res) {
            // NOTE: when enabling SSO, the user doesn't have to register and the token is undefined
            if (res.data.registrationToken) {
                setRegistrationToken(res.data.registrationToken);
            }
            goNext();
        } else {
            toggleNotification({
                type: 'danger',
                message: formatAPIError(res.error)
            });
            if (isBaseQueryError(res.error) && res.error.name === 'ValidationError') {
                setErrors(formatValidationErrors(res.error));
            }
        }
    };
    const goNext = ()=>{
        if (next) {
            setStep(next);
        } else {
            onToggle();
        }
    };
    const { buttonSubmitLabel, isDisabled, next } = STEPPER[currentStep];
    // block rendering until the EE component is fully loaded
    if (!MagicLink) {
        return null;
    }
    return /*#__PURE__*/ jsx(Modal.Root, {
        defaultOpen: true,
        onOpenChange: onToggle,
        children: /*#__PURE__*/ jsxs(Modal.Content, {
            children: [
                /*#__PURE__*/ jsx(Modal.Header, {
                    children: /*#__PURE__*/ jsx(Breadcrumbs, {
                        label: headerTitle,
                        children: /*#__PURE__*/ jsx(Crumb, {
                            isCurrent: true,
                            children: headerTitle
                        })
                    })
                }),
                /*#__PURE__*/ jsx(Form, {
                    method: currentStep === 'create' ? 'POST' : 'PUT',
                    initialValues: initialValues ?? {},
                    onSubmit: handleSubmit,
                    validationSchema: FORM_SCHEMA,
                    children: ({ isSubmitting })=>{
                        return /*#__PURE__*/ jsxs(Fragment, {
                            children: [
                                /*#__PURE__*/ jsx(Modal.Body, {
                                    children: /*#__PURE__*/ jsxs(Flex, {
                                        direction: "column",
                                        alignItems: "stretch",
                                        gap: 6,
                                        children: [
                                            currentStep !== 'create' && /*#__PURE__*/ jsx(MagicLink, {
                                                registrationToken: registrationToken
                                            }),
                                            /*#__PURE__*/ jsxs(Box, {
                                                children: [
                                                    /*#__PURE__*/ jsx(Typography, {
                                                        variant: "beta",
                                                        tag: "h2",
                                                        children: formatMessage({
                                                            id: 'app.components.Users.ModalCreateBody.block-title.details',
                                                            defaultMessage: 'User details'
                                                        })
                                                    }),
                                                    /*#__PURE__*/ jsx(Box, {
                                                        paddingTop: 4,
                                                        children: /*#__PURE__*/ jsx(Flex, {
                                                            direction: "column",
                                                            alignItems: "stretch",
                                                            gap: 1,
                                                            children: /*#__PURE__*/ jsx(Grid.Root, {
                                                                gap: 5,
                                                                children: FORM_LAYOUT.map((row)=>{
                                                                    return row.map(({ size, ...field })=>{
                                                                        return /*#__PURE__*/ jsx(Grid.Item, {
                                                                            col: size,
                                                                            direction: "column",
                                                                            alignItems: "stretch",
                                                                            children: /*#__PURE__*/ jsx(MemoizedInputRenderer, {
                                                                                ...field,
                                                                                disabled: isDisabled,
                                                                                label: formatMessage(field.label),
                                                                                placeholder: formatMessage(field.placeholder)
                                                                            })
                                                                        }, field.name);
                                                                    });
                                                                })
                                                            })
                                                        })
                                                    })
                                                ]
                                            }),
                                            /*#__PURE__*/ jsxs(Box, {
                                                children: [
                                                    /*#__PURE__*/ jsx(Typography, {
                                                        variant: "beta",
                                                        tag: "h2",
                                                        children: formatMessage({
                                                            id: 'global.roles',
                                                            defaultMessage: "User's role"
                                                        })
                                                    }),
                                                    /*#__PURE__*/ jsx(Box, {
                                                        paddingTop: 4,
                                                        children: /*#__PURE__*/ jsxs(Grid.Root, {
                                                            gap: 5,
                                                            children: [
                                                                /*#__PURE__*/ jsx(Grid.Item, {
                                                                    col: 6,
                                                                    xs: 12,
                                                                    direction: "column",
                                                                    alignItems: "stretch",
                                                                    children: /*#__PURE__*/ jsx(SelectRoles, {
                                                                        disabled: isDisabled
                                                                    })
                                                                }),
                                                                roleLayout.map((row)=>{
                                                                    return row.map(({ size, ...field })=>{
                                                                        return /*#__PURE__*/ jsx(Grid.Item, {
                                                                            col: size,
                                                                            direction: "column",
                                                                            alignItems: "stretch",
                                                                            children: /*#__PURE__*/ jsx(MemoizedInputRenderer, {
                                                                                ...field,
                                                                                disabled: isDisabled,
                                                                                label: formatMessage(field.label),
                                                                                placeholder: field.placeholder ? formatMessage(field.placeholder) : undefined,
                                                                                hint: field.hint ? formatMessage(field.hint) : undefined
                                                                            })
                                                                        }, field.name);
                                                                    });
                                                                })
                                                            ]
                                                        })
                                                    })
                                                ]
                                            })
                                        ]
                                    })
                                }),
                                /*#__PURE__*/ jsxs(Modal.Footer, {
                                    children: [
                                        /*#__PURE__*/ jsx(Button, {
                                            variant: "tertiary",
                                            onClick: onToggle,
                                            type: "button",
                                            children: formatMessage({
                                                id: 'app.components.Button.cancel',
                                                defaultMessage: 'Cancel'
                                            })
                                        }),
                                        currentStep === 'create' ? /*#__PURE__*/ jsx(Button, {
                                            type: "submit",
                                            loading: isSubmitting,
                                            children: formatMessage(buttonSubmitLabel)
                                        }) : /*#__PURE__*/ jsx(Button, {
                                            type: "button",
                                            loading: isSubmitting,
                                            onClick: onToggle,
                                            children: formatMessage(buttonSubmitLabel)
                                        })
                                    ]
                                })
                            ]
                        });
                    }
                })
            ]
        })
    });
};
const FORM_INITIAL_VALUES = {
    firstname: '',
    lastname: '',
    email: '',
    roles: []
};
const ROLE_LAYOUT = [];
const FORM_LAYOUT = [
    [
        {
            label: {
                id: 'Auth.form.firstname.label',
                defaultMessage: 'First name'
            },
            name: 'firstname',
            placeholder: {
                id: 'Auth.form.firstname.placeholder',
                defaultMessage: 'e.g. Kai'
            },
            type: 'string',
            size: 6,
            required: true
        },
        {
            label: {
                id: 'Auth.form.lastname.label',
                defaultMessage: 'Last name'
            },
            name: 'lastname',
            placeholder: {
                id: 'Auth.form.lastname.placeholder',
                defaultMessage: 'e.g. Doe'
            },
            type: 'string',
            size: 6
        }
    ],
    [
        {
            label: {
                id: 'Auth.form.email.label',
                defaultMessage: 'Email'
            },
            name: 'email',
            placeholder: {
                id: 'Auth.form.email.placeholder',
                defaultMessage: 'e.g. kai.doe@strapi.io'
            },
            type: 'email',
            size: 6,
            required: true
        }
    ]
];
const FORM_SCHEMA = yup.object().shape({
    firstname: yup.string().trim().required({
        id: errorsTrads.required.id,
        defaultMessage: 'This field is required'
    }).nullable(),
    lastname: yup.string(),
    email: yup.string().email(errorsTrads.email).required({
        id: errorsTrads.required.id,
        defaultMessage: 'This field is required'
    }).nullable(),
    roles: yup.array().min(1, {
        id: errorsTrads.required.id,
        defaultMessage: 'This field is required'
    }).required({
        id: errorsTrads.required.id,
        defaultMessage: 'This field is required'
    })
});
const STEPPER = {
    create: {
        buttonSubmitLabel: {
            id: 'app.containers.Users.ModalForm.footer.button-success',
            defaultMessage: 'Invite user'
        },
        isDisabled: false,
        next: 'magic-link'
    },
    'magic-link': {
        buttonSubmitLabel: {
            id: 'global.finish',
            defaultMessage: 'Finish'
        },
        isDisabled: true,
        next: null
    }
};

export { ModalForm };
//# sourceMappingURL=NewUserForm.mjs.map
