import { jsxs, jsx } from 'react/jsx-runtime';
import * as React from 'react';
import { TextButton, Flex, Field, Box, Grid, IconButton, Combobox, ComboboxOption } from '@strapi/design-system';
import { Minus, Plus } from '@strapi/icons';
import { useIntl } from 'react-intl';
import { styled } from 'styled-components';
import { useForm, useField } from '../../../../../components/Form.mjs';
import { StringInput as MemoizedStringInput } from '../../../../../components/FormInputs/String.mjs';

const AddHeaderButton = styled(TextButton)`
  cursor: pointer;
`;
const HeadersInput = ()=>{
    const { formatMessage } = useIntl();
    const addFieldRow = useForm('HeadersInput', (state)=>state.addFieldRow);
    const removeFieldRow = useForm('HeadersInput', (state)=>state.removeFieldRow);
    const setFieldValue = useForm('HeadersInput', (state)=>state.onChange);
    const { value = [] } = useField('headers');
    const removeRow = (index)=>{
        // if we are removing the last row, simply clear it
        if (value.length === 1) {
            setFieldValue('headers', [
                {
                    key: '',
                    value: ''
                }
            ]);
        } else {
            removeFieldRow('headers', index);
        }
    };
    return /*#__PURE__*/ jsxs(Flex, {
        direction: "column",
        alignItems: "stretch",
        gap: 1,
        children: [
            /*#__PURE__*/ jsx(Field.Label, {
                children: formatMessage({
                    id: 'Settings.webhooks.form.headers',
                    defaultMessage: 'Headers'
                })
            }),
            /*#__PURE__*/ jsxs(Box, {
                padding: 8,
                background: "neutral100",
                hasRadius: true,
                children: [
                    value.map((val, index)=>{
                        return /*#__PURE__*/ jsxs(Grid.Root, {
                            gap: 4,
                            padding: 2,
                            children: [
                                /*#__PURE__*/ jsx(Grid.Item, {
                                    col: 6,
                                    direction: "column",
                                    alignItems: "stretch",
                                    children: /*#__PURE__*/ jsx(HeaderCombobox, {
                                        name: `headers.${index}.key`,
                                        "aria-label": `row ${index + 1} key`,
                                        label: formatMessage({
                                            id: 'Settings.webhooks.key',
                                            defaultMessage: 'Key'
                                        })
                                    })
                                }),
                                /*#__PURE__*/ jsx(Grid.Item, {
                                    col: 6,
                                    direction: "column",
                                    alignItems: "stretch",
                                    children: /*#__PURE__*/ jsxs(Flex, {
                                        alignItems: "flex-end",
                                        gap: 2,
                                        children: [
                                            /*#__PURE__*/ jsx(Box, {
                                                style: {
                                                    flex: 1
                                                },
                                                children: /*#__PURE__*/ jsx(MemoizedStringInput, {
                                                    name: `headers.${index}.value`,
                                                    "aria-label": `row ${index + 1} value`,
                                                    label: formatMessage({
                                                        id: 'Settings.webhooks.value',
                                                        defaultMessage: 'Value'
                                                    }),
                                                    type: "string"
                                                })
                                            }),
                                            /*#__PURE__*/ jsx(IconButton, {
                                                width: "4rem",
                                                height: "4rem",
                                                onClick: ()=>removeRow(index),
                                                color: "primary600",
                                                label: formatMessage({
                                                    id: 'Settings.webhooks.headers.remove',
                                                    defaultMessage: 'Remove header row {number}'
                                                }, {
                                                    number: index + 1
                                                }),
                                                type: "button",
                                                children: /*#__PURE__*/ jsx(Minus, {
                                                    width: "0.8rem"
                                                })
                                            })
                                        ]
                                    })
                                })
                            ]
                        }, `${index}-${JSON.stringify(val.key)}`);
                    }),
                    /*#__PURE__*/ jsx(Box, {
                        paddingTop: 4,
                        children: /*#__PURE__*/ jsx(AddHeaderButton, {
                            type: "button",
                            onClick: ()=>{
                                addFieldRow('headers', {
                                    key: '',
                                    value: ''
                                });
                            },
                            startIcon: /*#__PURE__*/ jsx(Plus, {}),
                            children: formatMessage({
                                id: 'Settings.webhooks.create.header',
                                defaultMessage: 'Create new header'
                            })
                        })
                    })
                ]
            })
        ]
    });
};
const HeaderCombobox = ({ name, label, ...restProps })=>{
    const [options, setOptions] = React.useState([
        ...HTTP_HEADERS
    ]);
    const { value: headers } = useField('headers');
    const field = useField(name);
    React.useEffect(()=>{
        const headerOptions = HTTP_HEADERS.filter((key)=>!headers?.some((header)=>header.key !== field.value && header.key === key));
        setOptions(headerOptions);
    }, [
        headers,
        field.value
    ]);
    const handleChange = (value)=>{
        field.onChange(name, value);
    };
    const handleCreateOption = (value)=>{
        setOptions((prev)=>[
                ...prev,
                value
            ]);
        if (value) {
            handleChange(value);
        }
    };
    return /*#__PURE__*/ jsxs(Field.Root, {
        name: name,
        error: field.error,
        children: [
            /*#__PURE__*/ jsx(Field.Label, {
                children: label
            }),
            /*#__PURE__*/ jsx(Combobox, {
                ...restProps,
                onClear: ()=>handleChange(''),
                onChange: handleChange,
                onCreateOption: handleCreateOption,
                placeholder: "",
                creatable: true,
                value: field.value,
                children: options.map((key)=>/*#__PURE__*/ jsx(ComboboxOption, {
                        value: key,
                        children: key
                    }, key))
            }),
            /*#__PURE__*/ jsx(Field.Error, {})
        ]
    });
};
const HTTP_HEADERS = [
    'A-IM',
    'Accept',
    'Accept-Charset',
    'Accept-Encoding',
    'Accept-Language',
    'Accept-Datetime',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers',
    'Authorization',
    'Cache-Control',
    'Connection',
    'Content-Length',
    'Content-Type',
    'Cookie',
    'Date',
    'Expect',
    'Forwarded',
    'From',
    'Host',
    'If-Match',
    'If-Modified-Since',
    'If-None-Match',
    'If-Range',
    'If-Unmodified-Since',
    'Max-Forwards',
    'Origin',
    'Pragma',
    'Proxy-Authorization',
    'Range',
    'Referer',
    'TE',
    'User-Agent',
    'Upgrade',
    'Via',
    'Warning'
];

export { HeadersInput };
//# sourceMappingURL=HeadersInput.mjs.map
