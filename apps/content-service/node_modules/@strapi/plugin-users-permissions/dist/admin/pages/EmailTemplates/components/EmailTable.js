'use strict';

var jsxRuntime = require('react/jsx-runtime');
require('react');
var designSystem = require('@strapi/design-system');
var icons = require('@strapi/icons');
var PropTypes = require('prop-types');
var reactIntl = require('react-intl');
require('lodash/isEmpty');
var getTrad = require('../../../utils/getTrad.js');

const EmailTable = ({ canUpdate, onEditClick })=>{
    const { formatMessage } = reactIntl.useIntl();
    return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Table, {
        colCount: 3,
        rowCount: 3,
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Thead, {
                children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Tr, {
                    children: [
                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Th, {
                            width: "1%",
                            children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.VisuallyHidden, {
                                children: formatMessage({
                                    id: getTrad('Email.template.table.icon.label'),
                                    defaultMessage: 'icon'
                                })
                            })
                        }),
                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Th, {
                            children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                variant: "sigma",
                                textColor: "neutral600",
                                children: formatMessage({
                                    id: getTrad('Email.template.table.name.label'),
                                    defaultMessage: 'name'
                                })
                            })
                        }),
                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Th, {
                            width: "1%",
                            children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.VisuallyHidden, {
                                children: formatMessage({
                                    id: getTrad('Email.template.table.action.label'),
                                    defaultMessage: 'action'
                                })
                            })
                        })
                    ]
                })
            }),
            /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Tbody, {
                children: [
                    /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Tr, {
                        cursor: "pointer",
                        onClick: ()=>onEditClick('reset_password'),
                        children: [
                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Td, {
                                children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                                    width: "3.2rem",
                                    height: "3.2rem",
                                    padding: "0.8rem",
                                    children: /*#__PURE__*/ jsxRuntime.jsx(icons.ArrowClockwise, {
                                        "aria-label": formatMessage({
                                            id: 'global.reset-password',
                                            defaultMessage: 'Reset password'
                                        })
                                    })
                                })
                            }),
                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Td, {
                                children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                    children: formatMessage({
                                        id: 'global.reset-password',
                                        defaultMessage: 'Reset password'
                                    })
                                })
                            }),
                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Td, {
                                onClick: (e)=>e.stopPropagation(),
                                children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.IconButton, {
                                    onClick: ()=>onEditClick('reset_password'),
                                    label: formatMessage({
                                        id: getTrad('Email.template.form.edit.label'),
                                        defaultMessage: 'Edit a template'
                                    }),
                                    variant: "ghost",
                                    disabled: !canUpdate,
                                    children: /*#__PURE__*/ jsxRuntime.jsx(icons.Pencil, {})
                                })
                            })
                        ]
                    }),
                    /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Tr, {
                        cursor: "pointer",
                        onClick: ()=>onEditClick('email_confirmation'),
                        children: [
                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Td, {
                                children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                                    width: "3.2rem",
                                    height: "3.2rem",
                                    padding: "0.8rem",
                                    children: /*#__PURE__*/ jsxRuntime.jsx(icons.Check, {
                                        "aria-label": formatMessage({
                                            id: getTrad('Email.template.email_confirmation'),
                                            defaultMessage: 'Email address confirmation'
                                        })
                                    })
                                })
                            }),
                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Td, {
                                children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                    children: formatMessage({
                                        id: getTrad('Email.template.email_confirmation'),
                                        defaultMessage: 'Email address confirmation'
                                    })
                                })
                            }),
                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Td, {
                                onClick: (e)=>e.stopPropagation(),
                                children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.IconButton, {
                                    onClick: ()=>onEditClick('email_confirmation'),
                                    label: formatMessage({
                                        id: getTrad('Email.template.form.edit.label'),
                                        defaultMessage: 'Edit a template'
                                    }),
                                    variant: "ghost",
                                    disabled: !canUpdate,
                                    children: /*#__PURE__*/ jsxRuntime.jsx(icons.Pencil, {})
                                })
                            })
                        ]
                    })
                ]
            })
        ]
    });
};
EmailTable.propTypes = {
    canUpdate: PropTypes.bool.isRequired,
    onEditClick: PropTypes.func.isRequired
};

module.exports = EmailTable;
//# sourceMappingURL=EmailTable.js.map
