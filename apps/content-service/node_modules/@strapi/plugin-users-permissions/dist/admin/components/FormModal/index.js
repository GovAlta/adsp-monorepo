'use strict';

var jsxRuntime = require('react/jsx-runtime');
require('react');
var designSystem = require('@strapi/design-system');
var formik = require('formik');
var PropTypes = require('prop-types');
var reactIntl = require('react-intl');
var index = require('./Input/index.js');

const FormModal = ({ headerBreadcrumbs, initialData, isSubmiting, layout, isOpen, onSubmit, onToggle, providerToEditName })=>{
    const { formatMessage } = reactIntl.useIntl();
    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Modal.Root, {
        open: isOpen,
        onOpenChange: onToggle,
        children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Modal.Content, {
            children: [
                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Modal.Header, {
                    children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Breadcrumbs, {
                        label: headerBreadcrumbs.join(', '),
                        children: headerBreadcrumbs.map((crumb, index, arr)=>/*#__PURE__*/ jsxRuntime.jsx(designSystem.Crumb, {
                                isCurrent: index === arr.length - 1,
                                children: crumb
                            }, crumb))
                    })
                }),
                /*#__PURE__*/ jsxRuntime.jsx(formik.Formik, {
                    onSubmit: (values)=>onSubmit(values),
                    initialValues: initialData,
                    validationSchema: layout.schema,
                    validateOnChange: false,
                    children: ({ errors, handleChange, values })=>{
                        return /*#__PURE__*/ jsxRuntime.jsxs(formik.Form, {
                            children: [
                                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Modal.Body, {
                                    children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Flex, {
                                        direction: "column",
                                        alignItems: "stretch",
                                        gap: 1,
                                        children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Grid.Root, {
                                            gap: 5,
                                            children: layout.form.map((row)=>{
                                                return row.map((input)=>{
                                                    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Grid.Item, {
                                                        col: input.size,
                                                        xs: 12,
                                                        direction: "column",
                                                        alignItems: "stretch",
                                                        children: /*#__PURE__*/ jsxRuntime.jsx(index, {
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
                                /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Modal.Footer, {
                                    children: [
                                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Button, {
                                            variant: "tertiary",
                                            onClick: onToggle,
                                            type: "button",
                                            children: formatMessage({
                                                id: 'app.components.Button.cancel',
                                                defaultMessage: 'Cancel'
                                            })
                                        }),
                                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Button, {
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

module.exports = FormModal;
//# sourceMappingURL=index.js.map
