'use strict';

var jsxRuntime = require('react/jsx-runtime');

const styles = `
.strapi--root {
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  bottom: 0;
  background: #fff;
}

.strapi--no-js {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  font-family: helvetica, arial, sans-serif;
}
`;
/**
 * @internal
 *
 * @description this belongs to our default document that we render.
 */ const NoJavascript = ()=>{
    return /*#__PURE__*/ jsxRuntime.jsx("noscript", {
        children: /*#__PURE__*/ jsxRuntime.jsx("div", {
            className: "strapi--root",
            children: /*#__PURE__*/ jsxRuntime.jsxs("div", {
                className: "strapi--no-js",
                children: [
                    /*#__PURE__*/ jsxRuntime.jsx("style", {
                        type: "text/css",
                        children: styles
                    }),
                    /*#__PURE__*/ jsxRuntime.jsx("h1", {
                        children: "JavaScript disabled"
                    }),
                    /*#__PURE__*/ jsxRuntime.jsxs("p", {
                        children: [
                            "Please ",
                            /*#__PURE__*/ jsxRuntime.jsx("a", {
                                href: "https://www.enable-javascript.com/",
                                children: "enable JavaScript"
                            }),
                            " in your browser and reload the page to proceed."
                        ]
                    })
                ]
            })
        })
    });
};

exports.NoJavascript = NoJavascript;
//# sourceMappingURL=NoJavascript.js.map
