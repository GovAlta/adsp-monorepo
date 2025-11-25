import { jsxs, Fragment, jsx } from 'react/jsx-runtime';
import { Modal, Tabs, Box, Divider } from '@strapi/design-system';
import { useIntl } from 'react-intl';
import 'byte-size';
import 'date-fns';
import { getTrad } from '../../../utils/getTrad.mjs';
import 'qs';
import '../../../constants.mjs';
import '../../../utils/urlYupSchema.mjs';
import { FromComputerForm } from './FromComputerForm.mjs';
import { FromUrlForm } from './FromUrlForm.mjs';

const AddAssetStep = ({ onClose, onAddAsset, trackedLocation })=>{
    const { formatMessage } = useIntl();
    return /*#__PURE__*/ jsxs(Fragment, {
        children: [
            /*#__PURE__*/ jsx(Modal.Header, {
                children: /*#__PURE__*/ jsx(Modal.Title, {
                    children: formatMessage({
                        id: getTrad('header.actions.add-assets'),
                        defaultMessage: 'Add new assets'
                    })
                })
            }),
            /*#__PURE__*/ jsxs(Tabs.Root, {
                variant: "simple",
                defaultValue: "computer",
                children: [
                    /*#__PURE__*/ jsxs(Box, {
                        paddingLeft: 8,
                        paddingRight: 8,
                        paddingTop: 6,
                        children: [
                            /*#__PURE__*/ jsxs(Tabs.List, {
                                "aria-label": formatMessage({
                                    id: getTrad('tabs.title'),
                                    defaultMessage: 'How do you want to upload your assets?'
                                }),
                                children: [
                                    /*#__PURE__*/ jsx(Tabs.Trigger, {
                                        value: "computer",
                                        children: formatMessage({
                                            id: getTrad('modal.nav.computer'),
                                            defaultMessage: 'From computer'
                                        })
                                    }),
                                    /*#__PURE__*/ jsx(Tabs.Trigger, {
                                        value: "url",
                                        children: formatMessage({
                                            id: getTrad('modal.nav.url'),
                                            defaultMessage: 'From URL'
                                        })
                                    })
                                ]
                            }),
                            /*#__PURE__*/ jsx(Divider, {})
                        ]
                    }),
                    /*#__PURE__*/ jsx(Tabs.Content, {
                        value: "computer",
                        children: /*#__PURE__*/ jsx(FromComputerForm, {
                            onClose: onClose,
                            onAddAssets: onAddAsset,
                            trackedLocation: trackedLocation
                        })
                    }),
                    /*#__PURE__*/ jsx(Tabs.Content, {
                        value: "url",
                        children: /*#__PURE__*/ jsx(FromUrlForm, {
                            onClose: onClose,
                            onAddAsset: onAddAsset,
                            trackedLocation: trackedLocation
                        })
                    })
                ]
            })
        ]
    });
};

export { AddAssetStep };
//# sourceMappingURL=AddAssetStep.mjs.map
