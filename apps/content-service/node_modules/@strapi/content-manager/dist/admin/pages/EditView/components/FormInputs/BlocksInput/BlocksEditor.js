'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var strapiAdmin = require('@strapi/admin/strapi-admin');
var designSystem = require('@strapi/design-system');
var Icons = require('@strapi/icons');
var reactIntl = require('react-intl');
var slate = require('slate');
var slateHistory = require('slate-history');
var slateReact = require('slate-react');
var styledComponents = require('styled-components');
var translations = require('../../../../../utils/translations.js');
var Code = require('./Blocks/Code.js');
var Heading = require('./Blocks/Heading.js');
var Image = require('./Blocks/Image.js');
var Link = require('./Blocks/Link.js');
var List = require('./Blocks/List.js');
var Paragraph = require('./Blocks/Paragraph.js');
var Quote = require('./Blocks/Quote.js');
var BlocksContent = require('./BlocksContent.js');
var BlocksToolbar = require('./BlocksToolbar.js');
var EditorLayout = require('./EditorLayout.js');
var Modifiers = require('./Modifiers.js');
var withImages = require('./plugins/withImages.js');
var withLinks = require('./plugins/withLinks.js');
var withStrapiSchema = require('./plugins/withStrapiSchema.js');

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
const [BlocksEditorProvider, usePartialBlocksEditorContext] = strapiAdmin.createContext('BlocksEditor');
function useBlocksEditorContext(consumerName) {
    const context = usePartialBlocksEditorContext(consumerName, (state)=>state);
    const editor = slateReact.useSlate();
    return {
        ...context,
        editor
    };
}
/* -------------------------------------------------------------------------------------------------
 * BlocksEditor
 * -----------------------------------------------------------------------------------------------*/ const EditorDivider = styledComponents.styled(designSystem.Divider)`
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
    const slateUpdatesCount = React__namespace.useRef(0);
    // Keep track of how many times the value prop was updated, whether from within editor or from outside
    const valueUpdatesCount = React__namespace.useRef(0);
    // Use a key to force a rerender of the Slate editor when needed
    const [key, setKey] = React__namespace.useState(0);
    React__namespace.useEffect(()=>{
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
    const incrementSlateUpdatesCount = React__namespace.useCallback(()=>{
        slateUpdatesCount.current += 1;
    }, []);
    return {
        key,
        incrementSlateUpdatesCount
    };
}
const pipe = (...fns)=>(value)=>fns.reduce((prev, fn)=>fn(prev), value);
const BlocksEditor = /*#__PURE__*/ React__namespace.forwardRef(({ disabled = false, name, onChange, value, error, ...contentProps }, forwardedRef)=>{
    const { formatMessage } = reactIntl.useIntl();
    const [editor] = React__namespace.useState(()=>pipe(slateHistory.withHistory, withImages.withImages, withStrapiSchema.withStrapiSchema, slateReact.withReact, withLinks.withLinks)(slate.createEditor()));
    const [liveText, setLiveText] = React__namespace.useState('');
    const ariaDescriptionId = React__namespace.useId();
    const [isExpandedMode, handleToggleExpand] = React__namespace.useReducer((prev)=>!prev, false);
    /**
     * Editable is not able to hold the ref, https://github.com/ianstormtaylor/slate/issues/4082
     * so with "useImperativeHandle" we can use ReactEditor methods to expose to the parent above
     * also not passing forwarded ref here, gives console warning.
     */ React__namespace.useImperativeHandle(forwardedRef, ()=>({
            focus () {
                slateReact.ReactEditor.focus(editor);
            }
        }), [
        editor
    ]);
    const { key, incrementSlateUpdatesCount } = useResetKey(value);
    const debounceTimeout = React__namespace.useRef(null);
    const handleSlateChange = React__namespace.useCallback((state)=>{
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
    React__namespace.useEffect(()=>{
        return ()=>{
            if (debounceTimeout.current) {
                clearTimeout(debounceTimeout.current);
            }
        };
    }, []);
    // Ensure the editor is in sync after discard
    React__namespace.useEffect(()=>{
        // Compare the field value with the editor state to check for a stale selection
        if (value && JSON.stringify(editor.children) !== JSON.stringify(value)) {
            // When there is a diff, unset selection to avoid an invalid state
            slate.Transforms.deselect(editor);
        }
    }, [
        editor,
        value
    ]);
    const blocks = React__namespace.useMemo(()=>({
            ...Paragraph.paragraphBlocks,
            ...Heading.headingBlocks,
            ...List.listBlocks,
            ...Link.linkBlocks,
            ...Image.imageBlocks,
            ...Quote.quoteBlocks,
            ...Code.codeBlocks
        }), []);
    return /*#__PURE__*/ jsxRuntime.jsxs(jsxRuntime.Fragment, {
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.VisuallyHidden, {
                id: ariaDescriptionId,
                children: formatMessage({
                    id: translations.getTranslation('components.Blocks.dnd.instruction'),
                    defaultMessage: `To reorder blocks, press Command or Control along with Shift and the Up or Down arrow keys`
                })
            }),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.VisuallyHidden, {
                "aria-live": "assertive",
                children: liveText
            }),
            /*#__PURE__*/ jsxRuntime.jsx(slateReact.Slate, {
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
                children: /*#__PURE__*/ jsxRuntime.jsx(BlocksEditorProvider, {
                    blocks: blocks,
                    modifiers: Modifiers.modifiers,
                    disabled: disabled,
                    name: name,
                    setLiveText: setLiveText,
                    isExpandedMode: isExpandedMode,
                    children: /*#__PURE__*/ jsxRuntime.jsxs(EditorLayout.EditorLayout, {
                        error: error,
                        disabled: disabled,
                        onToggleExpand: handleToggleExpand,
                        ariaDescriptionId: ariaDescriptionId,
                        children: [
                            /*#__PURE__*/ jsxRuntime.jsx(BlocksToolbar.BlocksToolbar, {}),
                            /*#__PURE__*/ jsxRuntime.jsx(EditorDivider, {
                                width: "100%"
                            }),
                            /*#__PURE__*/ jsxRuntime.jsx(BlocksContent.BlocksContent, {
                                ...contentProps
                            }),
                            !isExpandedMode && /*#__PURE__*/ jsxRuntime.jsx(designSystem.IconButton, {
                                position: "absolute",
                                bottom: "1.2rem",
                                right: "1.2rem",
                                shadow: "filterShadow",
                                label: formatMessage({
                                    id: translations.getTranslation('components.Blocks.expand'),
                                    defaultMessage: 'Expand'
                                }),
                                onClick: handleToggleExpand,
                                children: /*#__PURE__*/ jsxRuntime.jsx(Icons.Expand, {})
                            })
                        ]
                    })
                })
            }, key)
        ]
    });
});

exports.BlocksEditor = BlocksEditor;
exports.BlocksEditorProvider = BlocksEditorProvider;
exports.isSelectorBlockKey = isSelectorBlockKey;
exports.useBlocksEditorContext = useBlocksEditorContext;
//# sourceMappingURL=BlocksEditor.js.map
