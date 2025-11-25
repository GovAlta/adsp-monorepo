'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var strapiAdmin = require('@strapi/admin/strapi-admin');
var designSystem = require('@strapi/design-system');
var urls = require('../../../../../utils/urls.js');
var Editor = require('./Editor.js');
var EditorLayout = require('./EditorLayout.js');
var utils = require('./utils/utils.js');
var WysiwygFooter = require('./WysiwygFooter.js');
var WysiwygNav = require('./WysiwygNav.js');

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

const Wysiwyg = /*#__PURE__*/ React__namespace.forwardRef(({ hint, disabled, label, name, placeholder, required, labelAction }, forwardedRef)=>{
    const field = strapiAdmin.useField(name);
    const textareaRef = React__namespace.useRef(null);
    const editorRef = React__namespace.useRef(null);
    const [isPreviewMode, setIsPreviewMode] = React__namespace.useState(false);
    const [mediaLibVisible, setMediaLibVisible] = React__namespace.useState(false);
    const [isExpandMode, setIsExpandMode] = React__namespace.useState(false);
    const components = strapiAdmin.useStrapiApp('ImageDialog', (state)=>state.components);
    const MediaLibraryDialog = components['media-library'];
    const handleToggleMediaLib = ()=>setMediaLibVisible((prev)=>!prev);
    const handleTogglePreviewMode = ()=>setIsPreviewMode((prev)=>!prev);
    const handleToggleExpand = ()=>{
        setIsPreviewMode(false);
        setIsExpandMode((prev)=>!prev);
    };
    const handleSelectAssets = (files)=>{
        const formattedFiles = files.map((f)=>({
                alt: f.alternativeText || f.name,
                url: urls.prefixFileUrlWithBackendUrl(f.url),
                mime: f.mime
            }));
        utils.insertFile(editorRef, formattedFiles);
        setMediaLibVisible(false);
    };
    return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Field.Root, {
        name: name,
        hint: hint,
        error: field.error,
        required: required,
        children: [
            /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                direction: "column",
                alignItems: "stretch",
                gap: 1,
                children: [
                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Label, {
                        action: labelAction,
                        children: label
                    }),
                    /*#__PURE__*/ jsxRuntime.jsxs(EditorLayout.EditorLayout, {
                        isExpandMode: isExpandMode,
                        error: field.error,
                        previewContent: field.value,
                        onCollapse: handleToggleExpand,
                        children: [
                            /*#__PURE__*/ jsxRuntime.jsx(WysiwygNav.WysiwygNav, {
                                isExpandMode: isExpandMode,
                                editorRef: editorRef,
                                isPreviewMode: isPreviewMode,
                                onToggleMediaLib: handleToggleMediaLib,
                                onTogglePreviewMode: isExpandMode ? undefined : handleTogglePreviewMode,
                                disabled: disabled
                            }),
                            /*#__PURE__*/ jsxRuntime.jsx(Editor.Editor, {
                                disabled: disabled,
                                isExpandMode: isExpandMode,
                                editorRef: editorRef,
                                error: field.error,
                                isPreviewMode: isPreviewMode,
                                name: name,
                                onChange: field.onChange,
                                placeholder: placeholder,
                                textareaRef: textareaRef,
                                value: field.value,
                                ref: forwardedRef
                            }),
                            !isExpandMode && /*#__PURE__*/ jsxRuntime.jsx(WysiwygFooter.WysiwygFooter, {
                                onToggleExpand: handleToggleExpand
                            })
                        ]
                    }),
                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Hint, {}),
                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Error, {})
                ]
            }),
            mediaLibVisible && // @ts-expect-error – TODO: fix this way of injecting because it's not really typeable without a registry.
            /*#__PURE__*/ jsxRuntime.jsx(MediaLibraryDialog, {
                onClose: handleToggleMediaLib,
                onSelectAssets: handleSelectAssets
            })
        ]
    });
});
const MemoizedWysiwyg = /*#__PURE__*/ React__namespace.memo(Wysiwyg);

exports.Wysiwyg = MemoizedWysiwyg;
//# sourceMappingURL=Field.js.map
