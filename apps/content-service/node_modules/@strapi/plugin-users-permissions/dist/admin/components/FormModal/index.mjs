import { jsx, jsxs } from 'react/jsx-runtime';
import 'react';
import { Modal, Breadcrumbs, Crumb, Flex, Grid, Button } from '@strapi/design-system';
import { Formik, Form } from 'formik';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import Input from './Input/index.mjs';

const FormModal = ({ headerBreadcrumbs, initialData, isSubmiting, layout, isOpen, onSubmit, onToggle, providerToEditName })=>{
    const { formatMessage } = useIntl();
    return /*#__PURE__*/ jsx(Modal.Root, {
        open: isOpen,
        onOpenChange: onToggle,
        children: /*#__PURE__*/ jsxs(Modal.Content, {
            children: [
                /*#__PURE__*/ jsx(Modal.Header, {
                    children: /*#__PURE__*/ jsx(Breadcrumbs, {
                        label: headerBreadcrumbs.join(', '),
                        children: headerBreadcrumbs.map((crumb, index, arr)=>/*#__PURE__*/ jsx(Crumb, {
                                isCurrent: index === arr.length - 1,
                                children: crumb
                            }, crumb))
                    })
                }),
                /*#__PURE__*/ jsx(Formik, {
                    onSubmit: (values)=>onSubmit(values),
                    initialValues: initialData,
                    validationSchema: layout.schema,
                    validateOnChange: false,
                    children: ({ errors, handleChange, values })=>{
                        return /*#__PURE__*/ jsxs(Form, {
                            children: [
                                /*#__PURE__*/ jsx(Modal.Body, {
                                    children: /*#__PURE__*/ jsx(Flex, {
                                        direction: "column",
                                        alignItems: "stretch",
                                        gap: 1,
                                        children: /*#__PURE__*/ jsx(Grid.Root, {
                                            gap: 5,
                                            children: layout.form.map((row)=>{
                                                return row.map((input)=>{
                                                    return /*#__PURE__*/ jsx(Grid.Item, {
                                                        col: input.size,
                                                        xs: 12,
                                                        direction: "column",
                                                        alignItems: "stretch",
                                                        children: /*#__PURE__*/ jsx(Input, {
                                                            ...input,
                                                            error: errors[input.name],
                                                            onChange: handleChange,
                                                            value: values[input.name],
                                                            providerToEditName: providerToEditName
                                                        })
                                                    }, input.name);
                                                });
                                            })
                                        })
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
                                        /*#__PURE__*/ jsx(Button, {
                                            type: "submit",
                                            loading: isSubmiting,
                                            children: formatMessage({
                                                id: 'global.save',
                                                defaultMessage: 'Save'
                                            })
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
FormModal.defaultProps = {
    initialData: null,
    providerToEditName: null
};
FormModal.propTypes = {
    headerBreadcrumbs: PropTypes.arrayOf(PropTypes.string).isRequired,
    initialData: PropTypes.object,
    layout: PropTypes.shape({
        form: PropTypes.arrayOf(PropTypes.array),
        schema: PropTypes.object
    }).isRequired,
    isOpen: PropTypes.bool.isRequired,
    isSubmiting: PropTypes.bool.isRequired,
    onSubmit: PropTypes.func.isRequired,
    onToggle: PropTypes.func.isRequired,
    providerToEditName: PropTypes.string
};

export { FormModal as default };
//# sourceMappingURL=index.mjs.map
