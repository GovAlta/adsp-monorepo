import { jsxs, Fragment, jsx } from 'react/jsx-runtime';
import * as React from 'react';
import { createContext } from '@strapi/admin/strapi-admin';
import { Divider, VisuallyHidden, IconButton } from '@strapi/design-system';
import { Expand } from '@strapi/icons';
import { useIntl } from 'react-intl';
import { createEditor, Transforms } from 'slate';
import { withHistory } from 'slate-history';
import { ReactEditor, Slate, useSlate, withReact } from 'slate-react';
import { styled } from 'styled-components';
import { getTranslation } from '../../../../../utils/translations.mjs';
import { codeBlocks } from './Blocks/Code.mjs';
import { headingBlocks } from './Blocks/Heading.mjs';
import { imageBlocks } from './Blocks/Image.mjs';
import { linkBlocks } from './Blocks/Link.mjs';
import { listBlocks } from './Blocks/List.mjs';
import { paragraphBlocks } from './Blocks/Paragraph.mjs';
import { quoteBlocks } from './Blocks/Quote.mjs';
import { BlocksContent } from './BlocksContent.mjs';
import { BlocksToolbar } from './BlocksToolbar.mjs';
import { EditorLayout } from './EditorLayout.mjs';
import { modifiers } from './Modifiers.mjs';
import { withImages } from './plugins/withImages.mjs';
import { withLinks } from './plugins/withLinks.mjs';
import { withStrapiSchema } from './plugins/withStrapiSchema.mjs';

const selectorBlockKeys = [
    'paragraph',
    'heading-one',
    'heading-two',
    'heading-three',
    'heading-four',
    'heading-five',
    'heading-six',
    'list-ordered',
    'list-unordered',
    'image',
    'quote',
    'code'
];
const isSelectorBlockKey = (key)=>{
    return typeof key === 'string' && selectorBlockKeys.includes(key);
};
const [BlocksEditorProvider, usePartialBlocksEditorContext] = createContext('BlocksEditor');
function useBlocksEditorContext(consumerName) {
    const context = usePartialBlocksEditorContext(consumerName, (state)=>state);
    const editor = useSlate();
    return {
        ...context,
        editor
    };
}
/* -------------------------------------------------------------------------------------------------
 * BlocksEditor
 * -----------------------------------------------------------------------------------------------*/ const EditorDivider = styled(Divider)`
  background: ${({ theme })=>theme.colors.neutral200};
`;
/**
 * Forces an update of the Slate editor when the value prop changes from outside of Slate.
 * The root cause is that Slate is not a controlled component: https://github.com/ianstormtaylor/slate/issues/4612
 * Why not use JSON.stringify(value) as the key?
 * Because it would force a rerender of the entire editor every time the user types a character.
 * Why not use the entity id as the key, since it's unique for each locale?
 * Because it would not solve the problem when using the "fill in from other locale" feature
 */ function useResetKey(value) {
    // Keep track how many times Slate detected a change from a user interaction in the editor
    const slateUpdatesCount = React.useRef(0);
    // Keep track of how many times the value prop was updated, whether from within editor or from outside
    const valueUpdatesCount = React.useRef(0);
    // Use a key to force a rerender of the Slate editor when needed
    const [key, setKey] = React.useState(0);
    React.useEffect(()=>{
        valueUpdatesCount.current += 1;
        // If the 2 refs are not equal, it means the value was updated from outside
        if (valueUpdatesCount.current !== slateUpdatesCount.current) {
            // So we change the key to force a rerender of the Slate editor,
            // which will pick up the new value through its initialValue prop
            setKey((previousKey)=>previousKey + 1);
            // Then bring the 2 refs back in sync
            slateUpdatesCount.current = valueUpdatesCount.current;
        }
    }, [
        value
    ]);
    const incrementSlateUpdatesCount = React.useCallback(()=>{
        slateUpdatesCount.current += 1;
    }, []);
    return {
        key,
        incrementSlateUpdatesCount
    };
}
const pipe = (...fns)=>(value)=>fns.reduce((prev, fn)=>fn(prev), value);
const BlocksEditor = /*#__PURE__*/ React.forwardRef(({ disabled = false, name, onChange, value, error, ...contentProps }, forwardedRef)=>{
    const { formatMessage } = useIntl();
    const [editor] = React.useState(()=>pipe(withHistory, withImages, withStrapiSchema, withReact, withLinks)(createEditor()));
    const [liveText, setLiveText] = React.useState('');
    const ariaDescriptionId = React.useId();
    const [isExpandedMode, handleToggleExpand] = React.useReducer((prev)=>!prev, false);
    /**
     * Editable is not able to hold the ref, https://github.com/ianstormtaylor/slate/issues/4082
     * so with "useImperativeHandle" we can use ReactEditor methods to expose to the parent above
     * also not passing forwarded ref here, gives console warning.
     */ React.useImperativeHandle(forwardedRef, ()=>({
            focus () {
                ReactEditor.focus(editor);
            }
        }), [
        editor
    ]);
    const { key, incrementSlateUpdatesCount } = useResetKey(value);
    const debounceTimeout = React.useRef(null);
    const handleSlateChange = React.useCallback((state)=>{
        const isAstChange = editor.operations.some((op)=>op.type !== 'set_selection');
        if (isAstChange) {
            /**
           * Slate handles the state of the editor internally. We just need to keep Strapi's form
           * state in sync with it in order to make sure that things like the "modified" state
           * isn't broken. Updating the whole state on every change is very expensive however,
           * so we debounce calls to onChange to mitigate input lag.
           */ if (debounceTimeout.current) {
                clearTimeout(debounceTimeout.current);
            }
            // Set a new debounce timeout
            debounceTimeout.current = setTimeout(()=>{
                incrementSlateUpdatesCount();
                onChange(name, state);
                debounceTimeout.current = null;
            }, 300);
        }
    }, [
        editor.operations,
        incrementSlateUpdatesCount,
        name,
        onChange
    ]);
    // Clean up the timeout on unmount
    React.useEffect(()=>{
        return ()=>{
            if (debounceTimeout.current) {
                clearTimeout(debounceTimeout.current);
            }
        };
    }, []);
    // Ensure the editor is in sync after discard
    React.useEffect(()=>{
        // Compare the field value with the editor state to check for a stale selection
        if (value && JSON.stringify(editor.children) !== JSON.stringify(value)) {
            // When there is a diff, unset selection to avoid an invalid state
            Transforms.deselect(editor);
        }
    }, [
        editor,
        value
    ]);
    const blocks = React.useMemo(()=>({
            ...paragraphBlocks,
            ...headingBlocks,
            ...listBlocks,
            ...linkBlocks,
            ...imageBlocks,
            ...quoteBlocks,
            ...codeBlocks
        }), []);
    return /*#__PURE__*/ jsxs(Fragment, {
        children: [
            /*#__PURE__*/ jsx(VisuallyHidden, {
                id: ariaDescriptionId,
                children: formatMessage({
                    id: getTranslation('components.Blocks.dnd.instruction'),
                    defaultMessage: `To reorder blocks, press Command or Control along with Shift and the Up or Down arrow keys`
                })
            }),
            /*#__PURE__*/ jsx(VisuallyHidden, {
                "aria-live": "assertive",
                children: liveText
            }),
            /*#__PURE__*/ jsx(Slate, {
                editor: editor,
                initialValue: value || [
                    {
                        type: 'paragraph',
                        children: [
                            {
                                type: 'text',
                                text: ''
                            }
                        ]
                    }
                ],
                onChange: handleSlateChange,
                children: /*#__PURE__*/ jsx(BlocksEditorProvider, {
                    blocks: blocks,
                    modifiers: modifiers,
                    disabled: disabled,
                    name: name,
                    setLiveText: setLiveText,
                    isExpandedMode: isExpandedMode,
                    children: /*#__PURE__*/ jsxs(EditorLayout, {
                        error: error,
                        disabled: disabled,
                        onToggleExpand: handleToggleExpand,
                        ariaDescriptionId: ariaDescriptionId,
                        children: [
                            /*#__PURE__*/ jsx(BlocksToolbar, {}),
                            /*#__PURE__*/ jsx(EditorDivider, {
                                width: "100%"
                            }),
                            /*#__PURE__*/ jsx(BlocksContent, {
                                ...contentProps
                            }),
                            !isExpandedMode && /*#__PURE__*/ jsx(IconButton, {
                                position: "absolute",
                                bottom: "1.2rem",
                                right: "1.2rem",
                                shadow: "filterShadow",
                                label: formatMessage({
                                    id: getTranslation('components.Blocks.expand'),
                                    defaultMessage: 'Expand'
                                }),
                                onClick: handleToggleExpand,
                                children: /*#__PURE__*/ jsx(Expand, {})
                            })
                        ]
                    })
                })
            }, key)
        ]
    });
});

export { BlocksEditor, BlocksEditorProvider, isSelectorBlockKey, useBlocksEditorContext };
//# sourceMappingURL=BlocksEditor.mjs.map
