import { jsx, jsxs } from 'react/jsx-runtime';
import * as React from 'react';
import { useTracking } from '@strapi/admin/strapi-admin';
import { Box, Field, Textarea, Modal, Button } from '@strapi/design-system';
import { Formik, Form } from 'formik';
import { useIntl } from 'react-intl';
import 'byte-size';
import 'date-fns';
import { getTrad } from '../../../utils/getTrad.mjs';
import 'qs';
import '../../../constants.mjs';
import { urlsToAssets } from '../../../utils/urlsToAssets.mjs';
import { urlSchema } from '../../../utils/urlYupSchema.mjs';

const FromUrlForm = ({ onClose, onAddAsset, trackedLocation })=>{
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState(undefined);
    const { formatMessage } = useIntl();
    const { trackUsage } = useTracking();
    const handleSubmit = async ({ urls })=>{
        setLoading(true);
        const urlArray = urls.split(/\r?\n/);
        try {
            const assets = await urlsToAssets(urlArray);
            if (trackedLocation) {
                trackUsage('didSelectFile', {
                    source: 'url',
                    location: trackedLocation
                });
            }
            // no need to set the loading to false since the component unmounts
            onAddAsset(assets);
        } catch (e) {
            setError(e);
            setLoading(false);
        }
    };
    return /*#__PURE__*/ jsx(Formik, {
        enableReinitialize: true,
        initialValues: {
            urls: ''
        },
        onSubmit: handleSubmit,
        validationSchema: urlSchema,
        validateOnChange: false,
        children: ({ values, errors, handleChange })=>/*#__PURE__*/ jsxs(Form, {
                noValidate: true,
                children: [
                    /*#__PURE__*/ jsx(Box, {
                        paddingLeft: 8,
                        paddingRight: 8,
                        paddingBottom: 6,
                        paddingTop: 6,
                        children: /*#__PURE__*/ jsxs(Field.Root, {
                            hint: formatMessage({
                                id: getTrad('input.url.description'),
                                defaultMessage: 'Separate your URL links by a carriage return.'
                            }),
                            error: error?.message || (errors.urls ? formatMessage({
                                id: errors.urls,
                                defaultMessage: 'An error occured'
                            }) : undefined),
                            children: [
                                /*#__PURE__*/ jsx(Field.Label, {
                                    children: formatMessage({
                                        id: getTrad('input.url.label'),
                                        defaultMessage: 'URL'
                                    })
                                }),
                                /*#__PURE__*/ jsx(Textarea, {
                                    name: "urls",
                                    onChange: handleChange,
                                    value: values.urls
                                }),
                                /*#__PURE__*/ jsx(Field.Hint, {}),
                                /*#__PURE__*/ jsx(Field.Error, {})
                            ]
                        })
                    }),
                    /*#__PURE__*/ jsxs(Modal.Footer, {
                        children: [
                            /*#__PURE__*/ jsx(Button, {
                                onClick: onClose,
                                variant: "tertiary",
                                children: formatMessage({
                                    id: 'app.components.Button.cancel',
                                    defaultMessage: 'cancel'
                                })
                            }),
                            /*#__PURE__*/ jsx(Button, {
                                type: "submit",
                                loading: loading,
                                children: formatMessage({
                                    id: getTrad('button.next'),
                                    defaultMessage: 'Next'
                                })
                            })
                        ]
                    })
                ]
            })
    });
};

export { FromUrlForm };
//# sourceMappingURL=FromUrlForm.mjs.map
