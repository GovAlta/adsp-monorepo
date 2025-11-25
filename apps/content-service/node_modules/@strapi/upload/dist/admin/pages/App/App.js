'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var strapiAdmin = require('@strapi/admin/strapi-admin');
var reactIntl = require('react-intl');
var reactRouterDom = require('react-router-dom');
var useConfig = require('../../hooks/useConfig.js');
require('byte-size');
require('date-fns');
var getTrad = require('../../utils/getTrad.js');
require('qs');
require('../../constants.js');
require('../../utils/urlYupSchema.js');
var MediaLibrary = require('./MediaLibrary/MediaLibrary.js');

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
const ConfigureTheView = /*#__PURE__*/ React__namespace.lazy(async ()=>Promise.resolve().then(function () { return require('./ConfigureTheView/ConfigureTheView.js'); }).then((mod)=>({
            default: mod.ConfigureTheView
        })));
const Upload = ()=>{
    const { config: { isLoading, isError, data: config } } = useConfig.useConfig();
    const [{ rawQuery }, setQuery] = strapiAdmin.useQueryParams();
    const { formatMessage } = reactIntl.useIntl();
    const title = formatMessage({
        id: getTrad.getTrad('plugin.name'),
        defaultMessage: 'Media Library'
    });
    React__namespace.useEffect(()=>{
        if (isLoading || isError || rawQuery) {
            return;
        }
        setQuery({
            sort: config.sort,
            page: 1,
            pageSize: config.pageSize
        });
    }, [
        isLoading,
        isError,
        config,
        rawQuery,
        setQuery
    ]);
    if (isLoading) {
        return /*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.Page.Loading, {});
    }
    return /*#__PURE__*/ jsxRuntime.jsxs(strapiAdmin.Page.Main, {
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.Page.Title, {
                children: title
            }),
            rawQuery ? /*#__PURE__*/ jsxRuntime.jsx(React__namespace.Suspense, {
                fallback: /*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.Page.Loading, {}),
                children: /*#__PURE__*/ jsxRuntime.jsxs(reactRouterDom.Routes, {
                    children: [
                        /*#__PURE__*/ jsxRuntime.jsx(reactRouterDom.Route, {
                            index: true,
                            element: /*#__PURE__*/ jsxRuntime.jsx(MediaLibrary.MediaLibrary, {})
                        }),
                        /*#__PURE__*/ jsxRuntime.jsx(reactRouterDom.Route, {
                            path: "configuration",
                            element: /*#__PURE__*/ jsxRuntime.jsx(ConfigureTheView, {
                                config: config
                            })
                        })
                    ]
                })
            }) : null
        ]
    });
};

exports.Upload = Upload;
//# sourceMappingURL=App.js.map
