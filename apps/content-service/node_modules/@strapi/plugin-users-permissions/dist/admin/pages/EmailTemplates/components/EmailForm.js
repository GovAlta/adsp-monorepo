'use strict';

var jsxRuntime = require('react/jsx-runtime');
require('react');
var designSystem = require('@strapi/design-system');
var admin = require('@strapi/strapi/admin');
var PropTypes = require('prop-types');
var reactIntl = require('react-intl');
require('lodash/isEmpty');
var getTrad = require('../../../utils/getTrad.js');
var schema = require('../utils/schema.js');

const EmailForm = ({ template = {}, onToggle, open, onSubmit })=>{
    const { formatMessage } = reactIntl.useIntl();
    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Modal.Root, {
        open: open,
        onOpenChange: onToggle,
        children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Modal.Content, {
            children: [
                /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Modal.Header, {
                    children: [
                        /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Breadcrumbs, {
                            label: `${formatMessage({
                                id: getTrad('PopUpForm.header.edit.email-templates'),
                                defaultMessage: 'Edit email template'
                            })}, ${template.display ? formatMessage({
                                id: getTrad(template.display),
                                defaultMessage: template.display
                            }) : ''}`,
                            children: [
                                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Crumb, {
                                    children: formatMessage({
                                        id: getTrad('PopUpForm.header.edit.email-templates'),
                                        defaultMessage: 'Edit email template'
                                    })
                                }),
                                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Crumb, {
                                    isCurrent: true,
                                    children: template.display ? formatMessage({
                                        id: getTrad(template.display),
                                        defaultMessage: template.display
                                    }) : ''
                                })
                            ]
                        }),
                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.VisuallyHidden, {
                            children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Modal.Title, {
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
                /*#__PURE__*/ jsxRuntime.jsx(admin.Form, {
                    onSubmit: onSubmit,
                    initialValues: template,
                    validationSchema: schema,
                    children: ({ isSubmitting })=>{
                        return /*#__PURE__*/ jsxRuntime.jsxs(jsxRuntime.Fragment, {
                            children: [
                                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Modal.Body, {
                                    children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Grid.Root, {
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
                                        ].map(({ size, ...field })=>/*#__PURE__*/ jsxRuntime.jsx(designSystem.Grid.Item, {
                                                col: size,
                                                direction: "column",
                                                alignItems: "stretch",
                                                children: /*#__PURE__*/ jsxRuntime.jsx(admin.InputRenderer, {
                                                    ...field
                                                })
                                            }, field.name))
                                    })
                                }),
                                /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Modal.Footer, {
                                    children: [
                                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Modal.Close, {
                                            children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Button, {
                                                variant: "tertiary",
                                                children: "Cancel"
                                            })
                                        }),
                                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Button, {
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

module.exports = EmailForm;
//# sourceMappingURL=EmailForm.js.map
