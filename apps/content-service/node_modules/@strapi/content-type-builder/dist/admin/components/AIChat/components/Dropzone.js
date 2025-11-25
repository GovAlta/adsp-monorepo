'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var designSystem = require('@strapi/design-system');
var reactDropzone = require('react-dropzone');

const useClipboardPasteImages = ({ onAddFiles, isEnabled = false })=>{
    const handlePaste = React.useCallback(async (e)=>{
        if (!isEnabled) return;
        // Try to get items from clipboard
        const items = e.clipboardData?.items;
        if (!items || items.length === 0) return;
        const files = [];
        // Process clipboard items
        for (const item of items){
            if (item.kind === 'file') {
                const file = item.getAsFile();
                if (file && file.type.startsWith('image/')) {
                    files.push(file);
                }
            }
        }
        if (files.length > 0) {
            onAddFiles(files);
            e.preventDefault(); // Prevent the default paste behavior
        }
    }, [
        isEnabled,
        onAddFiles
    ]);
    // Set up the paste event listener
    React.useEffect(()=>{
        document.addEventListener('paste', handlePaste);
        return ()=>{
            document.removeEventListener('paste', handlePaste);
        };
    }, [
        handlePaste
    ]);
};
const DropzoneContext = /*#__PURE__*/ React.createContext({});
const useDropzoneContext = ()=>React.useContext(DropzoneContext);
const Root = ({ children, isEnabled = true, onAddFiles = ()=>{}, accept = {
    'image/*': []
}, ...props })=>{
    // Use clipboard paste hook for handling clipboard events
    useClipboardPasteImages({
        onAddFiles,
        isEnabled,
        accept
    });
    // Use dropzone for drag and drop functionality
    const { getRootProps, isDragActive } = reactDropzone.useDropzone({
        onDrop: onAddFiles,
        noClick: true,
        noKeyboard: true,
        accept
    });
    return /*#__PURE__*/ jsxRuntime.jsx(DropzoneContext.Provider, {
        value: {
            isEnabled,
            isDragActive,
            onAddFiles
        },
        children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Flex, {
            direction: "column",
            alignItems: "flex-start",
            width: "100%",
            position: "relative",
            ...getRootProps(),
            ...props,
            children: children
        })
    });
};
const Area = ({ error, title, ...props })=>{
    const { isEnabled, isDragActive } = useDropzoneContext();
    // If not dragging, don't render the dropzone area
    if (!isDragActive) {
        return null;
    }
    const displayTitle = title || 'Drop images here';
    return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 2,
        cursor: isEnabled ? 'pointer' : 'not-allowed',
        width: "100%",
        height: "100%",
        borderStyle: "dashed",
        borderColor: error ? 'danger600' : 'primary500',
        background: error ? 'danger100' : 'primary100',
        hasRadius: true,
        padding: 7,
        justifyContent: "center",
        direction: "column",
        alignItems: "center",
        gap: 2,
        ...props,
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                width: "24px",
                height: "24px",
                children: /*#__PURE__*/ jsxRuntime.jsxs("svg", {
                    width: "24",
                    height: "24",
                    viewBox: "0 0 24 24",
                    fill: "none",
                    xmlns: "http://www.w3.org/2000/svg",
                    children: [
                        /*#__PURE__*/ jsxRuntime.jsx("path", {
                            d: "M19.5 13.572L12 6.072L4.5 13.572",
                            stroke: "currentColor",
                            strokeWidth: "2",
                            strokeLinecap: "round",
                            strokeLinejoin: "round"
                        }),
                        /*#__PURE__*/ jsxRuntime.jsx("path", {
                            d: "M12 6.072V20.072",
                            stroke: "currentColor",
                            strokeWidth: "2",
                            strokeLinecap: "round",
                            strokeLinejoin: "round"
                        }),
                        /*#__PURE__*/ jsxRuntime.jsx("path", {
                            d: "M3.9998 20.072H20.0001",
                            stroke: "currentColor",
                            strokeWidth: "2",
                            strokeLinecap: "round",
                            strokeLinejoin: "round"
                        })
                    ]
                })
            }),
            /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                direction: "column",
                alignItems: "center",
                gap: 2,
                children: [
                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                        variant: "omega",
                        textColor: "neutral600",
                        textAlign: "center",
                        children: displayTitle
                    }),
                    error && /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                        variant: "pi",
                        textColor: "danger600",
                        children: error
                    })
                ]
            })
        ]
    });
};
/* -------------------------------------------------------------------------------------------------
 * Dropzone Compound
 * -----------------------------------------------------------------------------------------------*/ const Dropzone = {
    Root,
    Area,
    useDropzoneContext
};

exports.Dropzone = Dropzone;
exports.Root = Root;
exports.useClipboardPasteImages = useClipboardPasteImages;
exports.useDropzoneContext = useDropzoneContext;
//# sourceMappingURL=Dropzone.js.map
