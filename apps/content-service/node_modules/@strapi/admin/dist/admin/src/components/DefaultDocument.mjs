import { jsxs, jsx } from 'react/jsx-runtime';
import { NoJavascript } from './NoJavascript.mjs';

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
    return /*#__PURE__*/ jsxs("html", {
        lang: "en",
        children: [
            /*#__PURE__*/ jsxs("head", {
                children: [
                    /*#__PURE__*/ jsx("meta", {
                        charSet: "utf-8"
                    }),
                    /*#__PURE__*/ jsx("meta", {
                        name: "viewport",
                        content: "width=device-width, initial-scale=1, viewport-fit=cover"
                    }),
                    /*#__PURE__*/ jsx("meta", {
                        name: "robots",
                        content: "noindex"
                    }),
                    /*#__PURE__*/ jsx("meta", {
                        name: "referrer",
                        content: "same-origin"
                    }),
                    /*#__PURE__*/ jsx("title", {
                        children: "Strapi Admin"
                    }),
                    /*#__PURE__*/ jsx("style", {
                        children: globalStyles
                    })
                ]
            }),
            /*#__PURE__*/ jsxs("body", {
                children: [
                    /*#__PURE__*/ jsx("div", {
                        id: "strapi"
                    }),
                    /*#__PURE__*/ jsx(NoJavascript, {}),
                    entryPath ? /*#__PURE__*/ jsx("script", {
                        type: "module",
                        src: entryPath
                    }) : null
                ]
            })
        ]
    });
};

export { DefaultDocument };
//# sourceMappingURL=DefaultDocument.mjs.map
