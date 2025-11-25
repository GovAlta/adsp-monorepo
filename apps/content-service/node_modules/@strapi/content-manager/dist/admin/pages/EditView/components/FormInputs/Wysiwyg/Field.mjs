import { jsxs, jsx } from 'react/jsx-runtime';
import * as React from 'react';
import { useField, useStrapiApp } from '@strapi/admin/strapi-admin';
import { Field, Flex } from '@strapi/design-system';
import { prefixFileUrlWithBackendUrl } from '../../../../../utils/urls.mjs';
import { Editor } from './Editor.mjs';
import { EditorLayout } from './EditorLayout.mjs';
import { insertFile } from './utils/utils.mjs';
import { WysiwygFooter } from './WysiwygFooter.mjs';
import { WysiwygNav } from './WysiwygNav.mjs';

const Wysiwyg = /*#__PURE__*/ React.forwardRef(({ hint, disabled, label, name, placeholder, required, labelAction }, forwardedRef)=>{
    const field = useField(name);
    const textareaRef = React.useRef(null);
    const editorRef = React.useRef(null);
    const [isPreviewMode, setIsPreviewMode] = React.useState(false);
    const [mediaLibVisible, setMediaLibVisible] = React.useState(false);
    const [isExpandMode, setIsExpandMode] = React.useState(false);
    const components = useStrapiApp('ImageDialog', (state)=>state.components);
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
                url: prefixFileUrlWithBackendUrl(f.url),
                mime: f.mime
            }));
        insertFile(editorRef, formattedFiles);
        setMediaLibVisible(false);
    };
    return /*#__PURE__*/ jsxs(Field.Root, {
        name: name,
        hint: hint,
        error: field.error,
        required: required,
        children: [
            /*#__PURE__*/ jsxs(Flex, {
                direction: "column",
                alignItems: "stretch",
                gap: 1,
                children: [
                    /*#__PURE__*/ jsx(Field.Label, {
                        action: labelAction,
                        children: label
                    }),
                    /*#__PURE__*/ jsxs(EditorLayout, {
                        isExpandMode: isExpandMode,
                        error: field.error,
                        previewContent: field.value,
                        onCollapse: handleToggleExpand,
                        children: [
                            /*#__PURE__*/ jsx(WysiwygNav, {
                                isExpandMode: isExpandMode,
                                editorRef: editorRef,
                                isPreviewMode: isPreviewMode,
                                onToggleMediaLib: handleToggleMediaLib,
                                onTogglePreviewMode: isExpandMode ? undefined : handleTogglePreviewMode,
                                disabled: disabled
                            }),
                            /*#__PURE__*/ jsx(Editor, {
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
                            !isExpandMode && /*#__PURE__*/ jsx(WysiwygFooter, {
                                onToggleExpand: handleToggleExpand
                            })
                        ]
                    }),
                    /*#__PURE__*/ jsx(Field.Hint, {}),
                    /*#__PURE__*/ jsx(Field.Error, {})
                ]
            }),
            mediaLibVisible && // @ts-expect-error – TODO: fix this way of injecting because it's not really typeable without a registry.
            /*#__PURE__*/ jsx(MediaLibraryDialog, {
                onClose: handleToggleMediaLib,
                onSelectAssets: handleSelectAssets
            })
        ]
    });
});
const MemoizedWysiwyg = /*#__PURE__*/ React.memo(Wysiwyg);

export { MemoizedWysiwyg as Wysiwyg };
//# sourceMappingURL=Field.mjs.map
