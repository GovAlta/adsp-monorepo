import { jsx, jsxs } from 'react/jsx-runtime';
import { Modal, Tabs, Flex, Typography, Divider } from '@strapi/design-system';
import { useIntl } from 'react-intl';
import { getTrad } from '../../utils/getTrad.mjs';
import { AttributeList } from './AttributeList.mjs';
import { CustomFieldsList } from './CustomFieldsList.mjs';

const AttributeOptions = ({ attributes, forTarget, kind })=>{
    const { formatMessage } = useIntl();
    const defaultTabId = getTrad('modalForm.tabs.default');
    const customTabId = getTrad('modalForm.tabs.custom');
    const titleIdSuffix = forTarget.includes('component') ? 'component' : kind;
    const titleId = getTrad(`modalForm.sub-header.chooseAttribute.${titleIdSuffix}`);
    return /*#__PURE__*/ jsx(Modal.Body, {
        children: /*#__PURE__*/ jsxs(Tabs.Root, {
            variant: "simple",
            defaultValue: "default",
            children: [
                /*#__PURE__*/ jsxs(Flex, {
                    justifyContent: "space-between",
                    children: [
                        /*#__PURE__*/ jsx(Typography, {
                            variant: "beta",
                            tag: "h2",
                            children: formatMessage({
                                id: titleId,
                                defaultMessage: 'Select a field'
                            })
                        }),
                        /*#__PURE__*/ jsxs(Tabs.List, {
                            children: [
                                /*#__PURE__*/ jsx(Tabs.Trigger, {
                                    value: "default",
                                    children: formatMessage({
                                        id: defaultTabId,
                                        defaultMessage: 'Default'
                                    })
                                }),
                                /*#__PURE__*/ jsx(Tabs.Trigger, {
                                    value: "custom",
                                    children: formatMessage({
                                        id: customTabId,
                                        defaultMessage: 'Custom'
                                    })
                                })
                            ]
                        })
                    ]
                }),
                /*#__PURE__*/ jsx(Divider, {
                    marginBottom: 6
                }),
                /*#__PURE__*/ jsx(Tabs.Content, {
                    value: "default",
                    children: /*#__PURE__*/ jsx(AttributeList, {
                        attributes: attributes
                    })
                }),
                /*#__PURE__*/ jsx(Tabs.Content, {
                    value: "custom",
                    children: /*#__PURE__*/ jsx(CustomFieldsList, {})
                })
            ]
        })
    });
};

export { AttributeOptions };
//# sourceMappingURL=AttributeOptions.mjs.map
