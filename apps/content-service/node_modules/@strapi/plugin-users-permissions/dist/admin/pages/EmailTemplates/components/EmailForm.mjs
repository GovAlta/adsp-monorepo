import { jsx, jsxs, Fragment } from 'react/jsx-runtime';
import 'react';
import { Modal, Breadcrumbs, Crumb, VisuallyHidden, Grid, Button } from '@strapi/design-system';
import { Form, InputRenderer } from '@strapi/strapi/admin';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import 'lodash/isEmpty';
import getTrad from '../../../utils/getTrad.mjs';
import schema from '../utils/schema.mjs';

const EmailForm = ({ template = {}, onToggle, open, onSubmit })=>{
    const { formatMessage } = useIntl();
    return /*#__PURE__*/ jsx(Modal.Root, {
        open: open,
        onOpenChange: onToggle,
        children: /*#__PURE__*/ jsxs(Modal.Content, {
            children: [
                /*#__PURE__*/ jsxs(Modal.Header, {
                    children: [
                        /*#__PURE__*/ jsxs(Breadcrumbs, {
                            label: `${formatMessage({
                                id: getTrad('PopUpForm.header.edit.email-templates'),
                                defaultMessage: 'Edit email template'
                            })}, ${template.display ? formatMessage({
                                id: getTrad(template.display),
                                defaultMessage: template.display
                            }) : ''}`,
                            children: [
                                /*#__PURE__*/ jsx(Crumb, {
                                    children: formatMessage({
                                        id: getTrad('PopUpForm.header.edit.email-templates'),
                                        defaultMessage: 'Edit email template'
                                    })
                                }),
                                /*#__PURE__*/ jsx(Crumb, {
                                    isCurrent: true,
                                    children: template.display ? formatMessage({
                                        id: getTrad(template.display),
                                        defaultMessage: template.display
                                    }) : ''
                                })
                            ]
                        }),
                        /*#__PURE__*/ jsx(VisuallyHidden, {
                            children: /*#__PURE__*/ jsx(Modal.Title, {
                                children: `${formatMessage({
                                    id: getTrad('PopUpForm.header.edit.email-templates'),
                                    defaultMessage: 'Edit email template'
                                })}, ${template.display ? formatMessage({
                                    id: getTrad(template.display),
                                    defaultMessage: template.display
                                }) : ''}`
                            })
                        })
                    ]
                }),
                /*#__PURE__*/ jsx(Form, {
                    onSubmit: onSubmit,
                    initialValues: template,
                    validationSchema: schema,
                    children: ({ isSubmitting })=>{
                        return /*#__PURE__*/ jsxs(Fragment, {
                            children: [
                                /*#__PURE__*/ jsx(Modal.Body, {
                                    children: /*#__PURE__*/ jsx(Grid.Root, {
                                        gap: 5,
                                        children: [
                                            {
                                                label: formatMessage({
                                                    id: getTrad('PopUpForm.Email.options.from.name.label'),
                                                    defaultMessage: 'Shipper name'
                                                }),
                                                name: 'options.from.name',
                                                size: 6,
                                                type: 'string'
                                            },
                                            {
                                                label: formatMessage({
                                                    id: getTrad('PopUpForm.Email.options.from.email.label'),
                                                    defaultMessage: 'Shipper email'
                                                }),
                                                name: 'options.from.email',
                                                size: 6,
                                                type: 'string'
                                            },
                                            {
                                                label: formatMessage({
                                                    id: getTrad('PopUpForm.Email.options.response_email.label'),
                                                    defaultMessage: 'Response email'
                                                }),
                                                name: 'options.response_email',
                                                size: 6,
                                                type: 'string'
                                            },
                                            {
                                                label: formatMessage({
                                                    id: getTrad('PopUpForm.Email.options.object.label'),
                                                    defaultMessage: 'Subject'
                                                }),
                                                name: 'options.object',
                                                size: 6,
                                                type: 'string'
                                            },
                                            {
                                                label: formatMessage({
                                                    id: getTrad('PopUpForm.Email.options.message.label'),
                                                    defaultMessage: 'Message'
                                                }),
                                                name: 'options.message',
                                                size: 12,
                                                type: 'text'
                                            }
                                        ].map(({ size, ...field })=>/*#__PURE__*/ jsx(Grid.Item, {
                                                col: size,
                                                direction: "column",
                                                alignItems: "stretch",
                                                children: /*#__PURE__*/ jsx(InputRenderer, {
                                                    ...field
                                                })
                                            }, field.name))
                                    })
                                }),
                                /*#__PURE__*/ jsxs(Modal.Footer, {
                                    children: [
                                        /*#__PURE__*/ jsx(Modal.Close, {
                                            children: /*#__PURE__*/ jsx(Button, {
                                                variant: "tertiary",
                                                children: "Cancel"
                                            })
                                        }),
                                        /*#__PURE__*/ jsx(Button, {
                                            loading: isSubmitting,
                                            type: "submit",
                                            children: "Finish"
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
EmailForm.defaultProps = {
    template: {}
};
EmailForm.propTypes = {
    template: PropTypes.shape({
        display: PropTypes.string,
        icon: PropTypes.string,
        options: PropTypes.shape({
            from: PropTypes.shape({
                name: PropTypes.string,
                email: PropTypes.string
            }),
            message: PropTypes.string,
            object: PropTypes.string,
            response_email: PropTypes.string
        })
    }),
    open: PropTypes.bool.isRequired,
    onSubmit: PropTypes.func.isRequired,
    onToggle: PropTypes.func.isRequired
};

export { EmailForm as default };
//# sourceMappingURL=EmailForm.mjs.map
