'use strict';

var React = require('react');
var strapiAdmin = require('@strapi/admin/strapi-admin');
var InputPopover = require('../components/InputPopover.js');
var Preview = require('../pages/Preview.js');
var constants = require('../utils/constants.js');
var getSendMessage = require('../utils/getSendMessage.js');

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

function usePreviewInputManager(name, attribute) {
    const iframe = Preview.usePreviewContext('usePreviewInputManager', (state)=>state.iframeRef, false);
    const setPopoverField = Preview.usePreviewContext('usePreviewInputManager', (state)=>state.setPopoverField, false);
    const hasInputPopoverParent = InputPopover.useHasInputPopoverParent();
    const { value } = strapiAdmin.useField(name);
    const { type } = attribute;
    React__namespace.useEffect(()=>{
        if (!iframe || !type) {
            return;
        }
        /**
     * Only send message if the field is not a data structure (component, dynamic zone)
     * because we already send events for their fields
     */ if (![
            'component',
            'dynamiczone'
        ].includes(type)) {
            const sendMessage = getSendMessage.getSendMessage(iframe);
            sendMessage(constants.INTERNAL_EVENTS.STRAPI_FIELD_CHANGE, {
                field: name,
                value
            });
        }
    }, [
        name,
        value,
        iframe,
        type
    ]);
    const sendMessage = getSendMessage.getSendMessage(iframe);
    return {
        onFocus: ()=>{
            if (hasInputPopoverParent) return;
            sendMessage(constants.INTERNAL_EVENTS.STRAPI_FIELD_FOCUS, {
                field: name
            });
        },
        onBlur: ()=>{
            if (hasInputPopoverParent) return;
            setPopoverField?.(null);
            sendMessage(constants.INTERNAL_EVENTS.STRAPI_FIELD_BLUR, {
                field: name
            });
        }
    };
}

exports.usePreviewInputManager = usePreviewInputManager;
//# sourceMappingURL=usePreviewInputManager.js.map
