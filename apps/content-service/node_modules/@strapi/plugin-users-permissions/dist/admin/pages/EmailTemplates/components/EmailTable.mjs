import { jsxs, jsx } from 'react/jsx-runtime';
import 'react';
import { Table, Thead, Tr, Th, VisuallyHidden, Typography, Tbody, Td, Box, IconButton } from '@strapi/design-system';
import { ArrowClockwise, Pencil, Check } from '@strapi/icons';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import 'lodash/isEmpty';
import getTrad from '../../../utils/getTrad.mjs';

const EmailTable = ({ canUpdate, onEditClick })=>{
    const { formatMessage } = useIntl();
    return /*#__PURE__*/ jsxs(Table, {
        colCount: 3,
        rowCount: 3,
        children: [
            /*#__PURE__*/ jsx(Thead, {
                children: /*#__PURE__*/ jsxs(Tr, {
                    children: [
                        /*#__PURE__*/ jsx(Th, {
                            width: "1%",
                            children: /*#__PURE__*/ jsx(VisuallyHidden, {
                                children: formatMessage({
                                    id: getTrad('Email.template.table.icon.label'),
                                    defaultMessage: 'icon'
                                })
                            })
                        }),
                        /*#__PURE__*/ jsx(Th, {
                            children: /*#__PURE__*/ jsx(Typography, {
                                variant: "sigma",
                                textColor: "neutral600",
                                children: formatMessage({
                                    id: getTrad('Email.template.table.name.label'),
                                    defaultMessage: 'name'
                                })
                            })
                        }),
                        /*#__PURE__*/ jsx(Th, {
                            width: "1%",
                            children: /*#__PURE__*/ jsx(VisuallyHidden, {
                                children: formatMessage({
                                    id: getTrad('Email.template.table.action.label'),
                                    defaultMessage: 'action'
                                })
                            })
                        })
                    ]
                })
            }),
            /*#__PURE__*/ jsxs(Tbody, {
                children: [
                    /*#__PURE__*/ jsxs(Tr, {
                        cursor: "pointer",
                        onClick: ()=>onEditClick('reset_password'),
                        children: [
                            /*#__PURE__*/ jsx(Td, {
                                children: /*#__PURE__*/ jsx(Box, {
                                    width: "3.2rem",
                                    height: "3.2rem",
                                    padding: "0.8rem",
                                    children: /*#__PURE__*/ jsx(ArrowClockwise, {
                                        "aria-label": formatMessage({
                                            id: 'global.reset-password',
                                            defaultMessage: 'Reset password'
                                        })
                                    })
                                })
                            }),
                            /*#__PURE__*/ jsx(Td, {
                                children: /*#__PURE__*/ jsx(Typography, {
                                    children: formatMessage({
                                        id: 'global.reset-password',
                                        defaultMessage: 'Reset password'
                                    })
                                })
                            }),
                            /*#__PURE__*/ jsx(Td, {
                                onClick: (e)=>e.stopPropagation(),
                                children: /*#__PURE__*/ jsx(IconButton, {
                                    onClick: ()=>onEditClick('reset_password'),
                                    label: formatMessage({
                                        id: getTrad('Email.template.form.edit.label'),
                                        defaultMessage: 'Edit a template'
                                    }),
                                    variant: "ghost",
                                    disabled: !canUpdate,
                                    children: /*#__PURE__*/ jsx(Pencil, {})
                                })
                            })
                        ]
                    }),
                    /*#__PURE__*/ jsxs(Tr, {
                        cursor: "pointer",
                        onClick: ()=>onEditClick('email_confirmation'),
                        children: [
                            /*#__PURE__*/ jsx(Td, {
                                children: /*#__PURE__*/ jsx(Box, {
                                    width: "3.2rem",
                                    height: "3.2rem",
                                    padding: "0.8rem",
                                    children: /*#__PURE__*/ jsx(Check, {
                                        "aria-label": formatMessage({
                                            id: getTrad('Email.template.email_confirmation'),
                                            defaultMessage: 'Email address confirmation'
                                        })
                                    })
                                })
                            }),
                            /*#__PURE__*/ jsx(Td, {
                                children: /*#__PURE__*/ jsx(Typography, {
                                    children: formatMessage({
                                        id: getTrad('Email.template.email_confirmation'),
                                        defaultMessage: 'Email address confirmation'
                                    })
                                })
                            }),
                            /*#__PURE__*/ jsx(Td, {
                                onClick: (e)=>e.stopPropagation(),
                                children: /*#__PURE__*/ jsx(IconButton, {
                                    onClick: ()=>onEditClick('email_confirmation'),
                                    label: formatMessage({
                                        id: getTrad('Email.template.form.edit.label'),
                                        defaultMessage: 'Edit a template'
                                    }),
                                    variant: "ghost",
                                    disabled: !canUpdate,
                                    children: /*#__PURE__*/ jsx(Pencil, {})
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

export { EmailTable as default };
//# sourceMappingURL=EmailTable.mjs.map
