import { jsx, jsxs } from 'react/jsx-runtime';
import { Modal, Flex, Loader, Grid, Field, Typography, Button } from '@strapi/design-system';
import { Formik, Form } from 'formik';
import isEmpty from 'lodash/isEmpty';
import { useIntl } from 'react-intl';
import { useBulkMove } from '../../hooks/useBulkMove.mjs';
import { useFolderStructure } from '../../hooks/useFolderStructure.mjs';
import 'byte-size';
import 'date-fns';
import { normalizeAPIError } from '../../utils/normalizeAPIError.mjs';
import { getTrad } from '../../utils/getTrad.mjs';
import 'qs';
import '../../constants.mjs';
import '../../utils/urlYupSchema.mjs';
import { SelectTree } from '../SelectTree/SelectTree.mjs';

const BulkMoveDialog = ({ onClose, selected = [], currentFolder })=>{
    const { formatMessage } = useIntl();
    const { data: folderStructure, isLoading } = useFolderStructure();
    const { move } = useBulkMove();
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
            const normalizedError = normalizeAPIError(error);
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
        return /*#__PURE__*/ jsx(Modal.Content, {
            children: /*#__PURE__*/ jsx(Modal.Body, {
                children: /*#__PURE__*/ jsx(Flex, {
                    justifyContent: "center",
                    paddingTop: 4,
                    paddingBottom: 4,
                    children: /*#__PURE__*/ jsx(Loader, {
                        children: formatMessage({
                            id: getTrad('content.isLoading'),
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
    return /*#__PURE__*/ jsx(Modal.Content, {
        children: /*#__PURE__*/ jsx(Formik, {
            validateOnChange: false,
            onSubmit: handleSubmit,
            initialValues: initialFormData,
            children: ({ values, errors, setFieldValue })=>/*#__PURE__*/ jsxs(Form, {
                    noValidate: true,
                    children: [
                        /*#__PURE__*/ jsx(Modal.Header, {
                            children: /*#__PURE__*/ jsx(Modal.Title, {
                                children: formatMessage({
                                    id: getTrad('modal.folder.move.title'),
                                    defaultMessage: 'Move elements to'
                                })
                            })
                        }),
                        /*#__PURE__*/ jsx(Modal.Body, {
                            children: /*#__PURE__*/ jsx(Grid.Root, {
                                gap: 4,
                                children: /*#__PURE__*/ jsx(Grid.Item, {
                                    xs: 12,
                                    col: 12,
                                    direction: "column",
                                    alignItems: "stretch",
                                    children: /*#__PURE__*/ jsxs(Field.Root, {
                                        id: "folder-destination",
                                        children: [
                                            /*#__PURE__*/ jsx(Field.Label, {
                                                children: formatMessage({
                                                    id: getTrad('form.input.label.folder-location'),
                                                    defaultMessage: 'Location'
                                                })
                                            }),
                                            /*#__PURE__*/ jsx(SelectTree, {
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
                                            errors.destination && /*#__PURE__*/ jsx(Typography, {
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
                        /*#__PURE__*/ jsxs(Modal.Footer, {
                            children: [
                                /*#__PURE__*/ jsx(Modal.Close, {
                                    children: /*#__PURE__*/ jsx(Button, {
                                        variant: "tertiary",
                                        name: "cancel",
                                        children: formatMessage({
                                            id: 'cancel',
                                            defaultMessage: 'Cancel'
                                        })
                                    })
                                }),
                                /*#__PURE__*/ jsx(Button, {
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

export { BulkMoveDialog };
//# sourceMappingURL=BulkMoveDialog.mjs.map
