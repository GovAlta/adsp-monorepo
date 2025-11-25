'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var designSystem = require('@strapi/design-system');
var icons = require('@strapi/icons');
var reactIntl = require('react-intl');
var styled = require('styled-components');
var Form = require('../../../../../components/Form.js');
var String = require('../../../../../components/FormInputs/String.js');

function _interopNamespaceDefault(e) {
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  }
  n.default = e;
  return Object.freeze(n);
}

var React__namespace = /*#__PURE__*/_interopNamespaceDefault(React);

const AddHeaderButton = styled.styled(designSystem.TextButton)`
  cursor: pointer;
`;
const HeadersInput = ()=>{
    const { formatMessage } = reactIntl.useIntl();
    const addFieldRow = Form.useForm('HeadersInput', (state)=>state.addFieldRow);
    const removeFieldRow = Form.useForm('HeadersInput', (state)=>state.removeFieldRow);
    const setFieldValue = Form.useForm('HeadersInput', (state)=>state.onChange);
    const { value = [] } = Form.useField('headers');
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
    return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
        direction: "column",
        alignItems: "stretch",
        gap: 1,
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Label, {
                children: formatMessage({
                    id: 'Settings.webhooks.form.headers',
                    defaultMessage: 'Headers'
                })
            }),
            /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Box, {
                padding: 8,
                background: "neutral100",
                hasRadius: true,
                children: [
                    value.map((val, index)=>{
                        return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Grid.Root, {
                            gap: 4,
                            padding: 2,
                            children: [
                                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Grid.Item, {
                                    col: 6,
                                    direction: "column",
                                    alignItems: "stretch",
                                    children: /*#__PURE__*/ jsxRuntime.jsx(HeaderCombobox, {
                                        name: `headers.${index}.key`,
                                        "aria-label": `row ${index + 1} key`,
                                        label: formatMessage({
                                            id: 'Settings.webhooks.key',
                                            defaultMessage: 'Key'
                                        })
                                    })
                                }),
                                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Grid.Item, {
                                    col: 6,
                                    direction: "column",
                                    alignItems: "stretch",
                                    children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                                        alignItems: "flex-end",
                                        gap: 2,
                                        children: [
                                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                                                style: {
                                                    flex: 1
                                                },
                                                children: /*#__PURE__*/ jsxRuntime.jsx(String.StringInput, {
                                                    name: `headers.${index}.value`,
                                                    "aria-label": `row ${index + 1} value`,
                                                    label: formatMessage({
                                                        id: 'Settings.webhooks.value',
                                                        defaultMessage: 'Value'
                                                    }),
                                                    type: "string"
                                                })
                                            }),
                                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.IconButton, {
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
                                                children: /*#__PURE__*/ jsxRuntime.jsx(icons.Minus, {
                                                    width: "0.8rem"
                                                })
                                            })
                                        ]
                                    })
                                })
                            ]
                        }, `${index}-${JSON.stringify(val.key)}`);
                    }),
                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                        paddingTop: 4,
                        children: /*#__PURE__*/ jsxRuntime.jsx(AddHeaderButton, {
                            type: "button",
                            onClick: ()=>{
                                addFieldRow('headers', {
                                    key: '',
                                    value: ''
                                });
                            },
                            startIcon: /*#__PURE__*/ jsxRuntime.jsx(icons.Plus, {}),
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
    const [options, setOptions] = React__namespace.useState([
        ...HTTP_HEADERS
    ]);
    const { value: headers } = Form.useField('headers');
    const field = Form.useField(name);
    React__namespace.useEffect(()=>{
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
    return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Field.Root, {
        name: name,
        error: field.error,
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Label, {
                children: label
            }),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Combobox, {
                ...restProps,
                onClear: ()=>handleChange(''),
                onChange: handleChange,
                onCreateOption: handleCreateOption,
                placeholder: "",
                creatable: true,
                value: field.value,
                children: options.map((key)=>/*#__PURE__*/ jsxRuntime.jsx(designSystem.ComboboxOption, {
                        value: key,
                        children: key
                    }, key))
            }),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Error, {})
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

exports.HeadersInput = HeadersInput;
//# sourceMappingURL=HeadersInput.js.map
