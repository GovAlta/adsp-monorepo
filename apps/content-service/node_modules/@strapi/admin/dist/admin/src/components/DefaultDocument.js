'use strict';

var jsxRuntime = require('react/jsx-runtime');
var NoJavascript = require('./NoJavascript.js');

/**
 * TODO: add favicons.........
 */ const globalStyles = `
  html,
  body,
  #strapi {
    height: 100%;
  }
  body {
    margin: 0;
    -webkit-font-smoothing: antialiased;
  }
`;
/**
 * @internal
 */ const DefaultDocument = ({ entryPath })=>{
    return /*#__PURE__*/ jsxRuntime.jsxs("html", {
        lang: "en",
        children: [
            /*#__PURE__*/ jsxRuntime.jsxs("head", {
                children: [
                    /*#__PURE__*/ jsxRuntime.jsx("meta", {
                        charSet: "utf-8"
                    }),
                    /*#__PURE__*/ jsxRuntime.jsx("meta", {
                        name: "viewport",
                        content: "width=device-width, initial-scale=1, viewport-fit=cover"
                    }),
                    /*#__PURE__*/ jsxRuntime.jsx("meta", {
                        name: "robots",
                        content: "noindex"
                    }),
                    /*#__PURE__*/ jsxRuntime.jsx("meta", {
                        name: "referrer",
                        content: "same-origin"
                    }),
                    /*#__PURE__*/ jsxRuntime.jsx("title", {
                        children: "Strapi Admin"
                    }),
                    /*#__PURE__*/ jsxRuntime.jsx("style", {
                        children: globalStyles
                    })
                ]
            }),
            /*#__PURE__*/ jsxRuntime.jsxs("body", {
                children: [
                    /*#__PURE__*/ jsxRuntime.jsx("div", {
                        id: "strapi"
                    }),
                    /*#__PURE__*/ jsxRuntime.jsx(NoJavascript.NoJavascript, {}),
                    entryPath ? /*#__PURE__*/ jsxRuntime.jsx("script", {
                        type: "module",
                        src: entryPath
                    }) : null
                ]
            })
        ]
    });
};

exports.DefaultDocument = DefaultDocument;
//# sourceMappingURL=DefaultDocument.js.map
