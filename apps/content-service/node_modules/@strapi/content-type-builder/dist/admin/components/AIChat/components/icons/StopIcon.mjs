import { jsx } from 'react/jsx-runtime';

const StopIcon = (props)=>{
    return /*#__PURE__*/ jsx("svg", {
        width: "16",
        height: "16",
        viewBox: "0 0 16 16",
        fill: "none",
        xmlns: "http://www.w3.org/2000/svg",
        ...props,
        children: /*#__PURE__*/ jsx("rect", {
            x: "2",
            y: "2",
            width: "11",
            height: "11",
            rx: "2",
            fill: "white"
        })
    });
};

export { StopIcon };
//# sourceMappingURL=StopIcon.mjs.map
