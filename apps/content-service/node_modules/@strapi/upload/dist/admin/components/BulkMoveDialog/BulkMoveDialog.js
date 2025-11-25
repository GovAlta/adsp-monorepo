'use strict';

var jsxRuntime = require('react/jsx-runtime');
var designSystem = require('@strapi/design-system');
var formik = require('formik');
var isEmpty = require('lodash/isEmpty');
var reactIntl = require('react-intl');
var useBulkMove = require('../../hooks/useBulkMove.js');
var useFolderStructure = require('../../hooks/useFolderStructure.js');
require('byte-size');
require('date-fns');
var normalizeAPIError = require('../../utils/normalizeAPIError.js');
var getTrad = require('../../utils/getTrad.js');
require('qs');
require('../../constants.js');
require('../../utils/urlYupSchema.js');
var SelectTree = require('../SelectTree/SelectTree.js');

const BulkMoveDialog = ({ onClose, selected = [], currentFolder })=>{
    const { formatMessage } = reactIntl.useIntl();
    const { data: folderStructure, isLoading } = useFolderStructure.useFolderStructure();
    const { move } = useBulkMove.useBulkMove();
    if (!folderStructure) {
        return null;
    }
    const handleSubmit = async (values, { setErrors })=>{
        try {
            if (typeof values.destination !== 'string') {
                const destinationValue = values.destination.value;
                await move(destinationValue, selected);
                onClose();
            }
        } catch (error) {
            const normalizedError = normalizeAPIError.normalizeAPIError(error);
            if (normalizedError && 'errors' in normalizedError) {
                const formikErrors = normalizedError.errors?.reduce((acc, error)=>{
                    acc[error.values?.path?.length || 'destination'] = error.defaultMessage;
                    return acc;
                }, {});
                if (!isEmpty(formikErrors)) {
                    setErrors(formikErrors);
                }
            }
        }
    };
    if (isLoading) {
        return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Modal.Content, {
            children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Modal.Body, {
                children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Flex, {
                    justifyContent: "center",
                    paddingTop: 4,
                    paddingBottom: 4,
                    children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Loader, {
                        children: formatMessage({
                            id: getTrad.getTrad('content.isLoading'),
                            defaultMessage: 'Content is loading.'
                        })
                    })
                })
            })
        });
    }
    const initialFormData = {
        destination: {
            value: currentFolder?.id || '',
            label: currentFolder?.name || folderStructure[0].label
        }
    };
    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Modal.Content, {
        children: /*#__PURE__*/ jsxRuntime.jsx(formik.Formik, {
            validateOnChange: false,
            onSubmit: handleSubmit,
            initialValues: initialFormData,
            children: ({ values, errors, setFieldValue })=>/*#__PURE__*/ jsxRuntime.jsxs(formik.Form, {
                    noValidate: true,
                    children: [
                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Modal.Header, {
                            children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Modal.Title, {
                                children: formatMessage({
                                    id: getTrad.getTrad('modal.folder.move.title'),
                                    defaultMessage: 'Move elements to'
                                })
                            })
                        }),
                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Modal.Body, {
                            children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Grid.Root, {
                                gap: 4,
                                children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Grid.Item, {
                                    xs: 12,
                                    col: 12,
                                    direction: "column",
                                    alignItems: "stretch",
                                    children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Field.Root, {
                                        id: "folder-destination",
                                        children: [
                                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Label, {
                                                children: formatMessage({
                                                    id: getTrad.getTrad('form.input.label.folder-location'),
                                                    defaultMessage: 'Location'
                                                })
                                            }),
                                            /*#__PURE__*/ jsxRuntime.jsx(SelectTree.SelectTree, {
                                                options: folderStructure,
                                                onChange: (value)=>{
                                                    setFieldValue('destination', value);
                                                },
                                                defaultValue: typeof values.destination !== 'string' ? values.destination : undefined,
                                                name: "destination",
                                                menuPortalTarget: document.querySelector('body'),
                                                inputId: "folder-destination",
                                                error: errors?.destination,
                                                ariaErrorMessage: "destination-error"
                                            }),
                                            errors.destination && /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                                variant: "pi",
                                                tag: "p",
                                                textColor: "danger600",
                                                children: errors.destination
                                            })
                                        ]
                                    })
                                })
                            })
                        }),
                        /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Modal.Footer, {
                            children: [
                                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Modal.Close, {
                                    children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Button, {
                                        variant: "tertiary",
                                        name: "cancel",
                                        children: formatMessage({
                                            id: 'cancel',
                                            defaultMessage: 'Cancel'
                                        })
                                    })
                                }),
                                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Button, {
                                    type: "submit",
                                    loading: isLoading,
                                    children: formatMessage({
                                        id: 'modal.folder.move.submit',
                                        defaultMessage: 'Move'
                                    })
                                })
                            ]
                        })
                    ]
                })
        })
    });
};

exports.BulkMoveDialog = BulkMoveDialog;
//# sourceMappingURL=BulkMoveDialog.js.map
