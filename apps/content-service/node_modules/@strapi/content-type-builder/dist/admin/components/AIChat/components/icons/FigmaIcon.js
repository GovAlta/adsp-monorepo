'use strict';

var jsxRuntime = require('react/jsx-runtime');

const FigmaIcon = (props)=>{
    return /*#__PURE__*/ jsxRuntime.jsxs("svg", {
        width: props.width || 16,
        height: props.height || 16,
        viewBox: "0 0 200 300",
        xmlns: "http://www.w3.org/2000/svg",
        "aria-label": "Figma logo",
        style: {
            display: 'block',
            margin: '0 auto',
            ...props.style
        },
        ...props,
        children: [
            /*#__PURE__*/ jsxRuntime.jsx("title", {
                children: "Figma.logo"
            }),
            /*#__PURE__*/ jsxRuntime.jsx("desc", {
                children: "Created using Figma"
            }),
            /*#__PURE__*/ jsxRuntime.jsx("path", {
                d: "M50 300c27.6 0 50-22.4 50-50v-50H50c-27.6 0-50 22.4-50 50s22.4 50 50 50z",
                fill: "#0acf83"
            }),
            /*#__PURE__*/ jsxRuntime.jsx("path", {
                d: "M50 200c-27.6 0-50-22.4-50-50s22.4-50 50-50h50v100H50z",
                fill: "#a259ff"
            }),
            /*#__PURE__*/ jsxRuntime.jsx("path", {
                d: "M0 50C0 22.4 22.4 0 50 0h50v100H50C22.4 100 0 77.6 0 50z",
                fill: "#f24e1e"
            }),
            /*#__PURE__*/ jsxRuntime.jsx("path", {
                d: "M100 0h50c27.6 0 50 22.4 50 50s-22.4 50-50 50h-50V0z",
                fill: "#ff7262"
            }),
            /*#__PURE__*/ jsxRuntime.jsx("path", {
                d: "M200 150c0 27.6-22.4 50-50 50s-50-22.4-50-50 22.4-50 50-50 50 22.4 50 50z",
                fill: "#1abcfe"
            })
        ]
    });
};

exports.FigmaIcon = FigmaIcon;
//# sourceMappingURL=FigmaIcon.js.map
