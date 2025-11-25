'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var strapiAdmin = require('@strapi/admin/strapi-admin');
var designSystem = require('@strapi/design-system');
var icons = require('@strapi/icons');
var reactIntl = require('react-intl');
require('byte-size');
require('date-fns');
var getTrad = require('../../../../utils/getTrad.js');
require('qs');
require('../../../../constants.js');
require('../../../../utils/urlYupSchema.js');

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

// TODO: find a better naming convention for the file that was an index file before
const SearchAsset = ({ onChangeSearch, queryValue = null })=>{
    const { formatMessage } = reactIntl.useIntl();
    const { trackUsage } = strapiAdmin.useTracking();
    const [isOpen, setIsOpen] = React__namespace.useState(!!queryValue);
    const [value, setValue] = React__namespace.useState(queryValue || '');
    const wrapperRef = React__namespace.useRef(null);
    React__namespace.useLayoutEffect(()=>{
        if (isOpen) {
            setTimeout(()=>{
                wrapperRef.current?.querySelector('input')?.focus();
            }, 0);
        }
    }, [
        isOpen
    ]);
    const handleToggle = ()=>{
        setIsOpen((prev)=>!prev);
    };
    const handleClear = ()=>{
        handleToggle();
        onChangeSearch(null);
    };
    const handleSubmit = (e)=>{
        e.preventDefault();
        e.stopPropagation();
        trackUsage('didSearchMediaLibraryElements', {
            location: 'content-manager'
        });
        onChangeSearch(value);
    };
    if (isOpen) {
        return /*#__PURE__*/ jsxRuntime.jsx("div", {
            ref: wrapperRef,
            children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.SearchForm, {
                onSubmit: handleSubmit,
                children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Searchbar, {
                    name: "search",
                    onClear: handleClear,
                    onChange: (e)=>setValue(e.target.value),
                    clearLabel: formatMessage({
                        id: getTrad.getTrad('search.clear.label'),
                        defaultMessage: 'Clear the search'
                    }),
                    "aria-label": "search",
                    size: "S",
                    value: value,
                    placeholder: formatMessage({
                        id: getTrad.getTrad('search.placeholder'),
                        defaultMessage: 'e.g: the first dog on the moon'
                    }),
                    children: formatMessage({
                        id: getTrad.getTrad('search.label'),
                        defaultMessage: 'Search for an asset'
                    })
                })
            })
        });
    }
    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.IconButton, {
        label: "Search",
        onClick: handleToggle,
        children: /*#__PURE__*/ jsxRuntime.jsx(icons.Search, {})
    });
};

exports.SearchAsset = SearchAsset;
//# sourceMappingURL=SearchAsset.js.map
