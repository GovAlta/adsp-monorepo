'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var strapiAdmin = require('@strapi/admin/strapi-admin');
var designSystem = require('@strapi/design-system');
var reactIntl = require('react-intl');
require('byte-size');
require('date-fns');
var getTrad = require('../../utils/getTrad.js');
require('qs');
require('../../constants.js');
require('../../utils/urlYupSchema.js');

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

const ReplaceMediaButton = ({ onSelectMedia, acceptedMime, trackedLocation, ...props })=>{
    const { formatMessage } = reactIntl.useIntl();
    const inputRef = React__namespace.useRef(null);
    const { trackUsage } = strapiAdmin.useTracking();
    const handleClick = (e)=>{
        e.preventDefault();
        if (trackedLocation) {
            trackUsage('didReplaceMedia', {
                location: trackedLocation
            });
        }
        inputRef.current?.click();
    };
    const handleChange = ()=>{
        const file = inputRef.current?.files?.[0];
        onSelectMedia(file);
    };
    return /*#__PURE__*/ jsxRuntime.jsxs(jsxRuntime.Fragment, {
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Button, {
                variant: "secondary",
                onClick: handleClick,
                ...props,
                children: formatMessage({
                    id: getTrad.getTrad('control-card.replace-media'),
                    defaultMessage: 'Replace media'
                })
            }),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.VisuallyHidden, {
                children: /*#__PURE__*/ jsxRuntime.jsx("input", {
                    accept: acceptedMime,
                    type: "file",
                    name: "file",
                    "data-testid": "file-input",
                    tabIndex: -1,
                    ref: inputRef,
                    onChange: handleChange,
                    "aria-hidden": true
                })
            })
        ]
    });
};

exports.ReplaceMediaButton = ReplaceMediaButton;
//# sourceMappingURL=ReplaceMediaButton.js.map
