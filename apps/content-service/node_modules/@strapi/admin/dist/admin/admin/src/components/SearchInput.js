'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var designSystem = require('@strapi/design-system');
var icons = require('@strapi/icons');
var reactIntl = require('react-intl');
var Tracking = require('../features/Tracking.js');
var useQueryParams = require('../hooks/useQueryParams.js');

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

const SearchInput = ({ disabled, label, placeholder, trackedEvent, trackedEventDetails })=>{
    const inputRef = React__namespace.useRef(null);
    const iconButtonRef = React__namespace.useRef(null);
    const [{ query }, setQuery] = useQueryParams.useQueryParams();
    const [value, setValue] = React__namespace.useState(query?._q || '');
    const [isOpen, setIsOpen] = React__namespace.useState(!!value);
    const { formatMessage } = reactIntl.useIntl();
    const { trackUsage } = Tracking.useTracking();
    const handleToggle = ()=>setIsOpen((prev)=>!prev);
    React__namespace.useLayoutEffect(()=>{
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [
        isOpen
    ]);
    const handleClear = ()=>{
        setValue('');
        setQuery({
            _q: ''
        }, 'remove');
    };
    const handleSubmit = (e)=>{
        e.preventDefault();
        // Ensure value is a string
        if (value) {
            if (trackedEvent) {
                trackUsage(trackedEvent, trackedEventDetails);
            }
            setQuery({
                _q: encodeURIComponent(value),
                page: 1
            });
        } else {
            handleToggle();
            setQuery({
                _q: ''
            }, 'remove');
        }
    };
    if (isOpen) {
        return /*#__PURE__*/ jsxRuntime.jsx(designSystem.SearchForm, {
            onSubmit: handleSubmit,
            children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Searchbar, {
                ref: inputRef,
                name: "search",
                onChange: (e)=>setValue(e.target.value),
                value: value,
                clearLabel: formatMessage({
                    id: 'clearLabel',
                    defaultMessage: 'Clear'
                }),
                onClear: handleClear,
                placeholder: placeholder,
                onBlur: (e)=>{
                    if (!e.currentTarget.contains(e.relatedTarget) && e.currentTarget.value === '') {
                        setIsOpen(false);
                    }
                },
                children: label
            })
        });
    }
    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.IconButton, {
        ref: iconButtonRef,
        disabled: disabled,
        label: formatMessage({
            id: 'global.search',
            defaultMessage: 'Search'
        }),
        onClick: handleToggle,
        children: /*#__PURE__*/ jsxRuntime.jsx(icons.Search, {})
    });
};

exports.SearchInput = SearchInput;
//# sourceMappingURL=SearchInput.js.map
