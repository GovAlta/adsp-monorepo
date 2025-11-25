import { jsx, jsxs } from 'react/jsx-runtime';

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
    return /*#__PURE__*/ jsx("noscript", {
        children: /*#__PURE__*/ jsx("div", {
            className: "strapi--root",
            children: /*#__PURE__*/ jsxs("div", {
                className: "strapi--no-js",
                children: [
                    /*#__PURE__*/ jsx("style", {
                        type: "text/css",
                        children: styles
                    }),
                    /*#__PURE__*/ jsx("h1", {
                        children: "JavaScript disabled"
                    }),
                    /*#__PURE__*/ jsxs("p", {
                        children: [
                            "Please ",
                            /*#__PURE__*/ jsx("a", {
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

export { NoJavascript };
//# sourceMappingURL=NoJavascript.mjs.map
