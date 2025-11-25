'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var designSystem = require('@strapi/design-system');
var reactIntl = require('react-intl');
var slate = require('slate');
var slateReact = require('slate-react');
var styledComponents = require('styled-components');
var BlocksEditor = require('../BlocksEditor.js');
var links = require('../utils/links.js');
var types = require('../utils/types.js');

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

const StyledLink = styledComponents.styled(designSystem.Box)`
  text-decoration: none;
`;
const RemoveButton = styledComponents.styled(designSystem.Button)`
  visibility: ${(props)=>props.$visible ? 'visible' : 'hidden'};
`;
const LinkContent = /*#__PURE__*/ React__namespace.forwardRef(({ link, children, attributes }, forwardedRef)=>{
    const { formatMessage } = reactIntl.useIntl();
    const { editor } = BlocksEditor.useBlocksEditorContext('Link');
    const path = slateReact.ReactEditor.findPath(editor, link);
    const [popoverOpen, setPopoverOpen] = React__namespace.useState(editor.lastInsertedLinkPath ? slate.Path.equals(path, editor.lastInsertedLinkPath) : false);
    const elementText = link.children.map((child)=>child.text).join('');
    const [linkText, setLinkText] = React__namespace.useState(elementText);
    const [linkUrl, setLinkUrl] = React__namespace.useState(link.url);
    const linkInputRef = React__namespace.useRef(null);
    const isLastInsertedLink = editor.lastInsertedLinkPath ? !slate.Path.equals(path, editor.lastInsertedLinkPath) : true;
    const [isSaveDisabled, setIsSaveDisabled] = React__namespace.useState(false);
    const onLinkChange = (e)=>{
        setIsSaveDisabled(false);
        setLinkUrl(e.target.value);
        try {
            // eslint-disable-next-line no-new
            new URL(e.target.value?.startsWith('/') ? `https://strapi.io${e.target.value}` : e.target.value);
        } catch (error) {
            setIsSaveDisabled(true);
        }
    };
    const handleSave = (e)=>{
        e.stopPropagation();
        // If the selection is collapsed, we select the parent node because we want all the link to be replaced)
        if (editor.selection && slate.Range.isCollapsed(editor.selection)) {
            const [, parentPath] = slate.Editor.parent(editor, editor.selection.focus?.path);
            slate.Transforms.select(editor, parentPath);
        }
        links.editLink(editor, {
            url: linkUrl,
            text: linkText
        });
        setPopoverOpen(false);
        editor.lastInsertedLinkPath = null;
        slateReact.ReactEditor.focus(editor);
    };
    const handleClose = ()=>{
        if (link.url === '') {
            links.removeLink(editor);
        }
        setPopoverOpen(false);
        slateReact.ReactEditor.focus(editor);
    };
    React__namespace.useEffect(()=>{
        // Focus on the link input element when the popover opens
        if (popoverOpen) linkInputRef.current?.focus();
    }, [
        popoverOpen
    ]);
    const inputNotDirty = !linkText || !linkUrl || link.url && link.url === linkUrl && elementText && elementText === linkText;
    return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Popover.Root, {
        open: popoverOpen,
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Popover.Trigger, {
                children: /*#__PURE__*/ jsxRuntime.jsx(StyledLink, {
                    ...attributes,
                    ref: forwardedRef,
                    tag: "a",
                    href: link.url,
                    onClick: ()=>setPopoverOpen(true),
                    color: "primary600",
                    children: children
                })
            }),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Popover.Content, {
                onPointerDownOutside: handleClose,
                children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                    padding: 4,
                    direction: "column",
                    gap: 4,
                    children: [
                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Root, {
                            width: "368px",
                            children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                                direction: "column",
                                gap: 1,
                                alignItems: "stretch",
                                children: [
                                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Label, {
                                        children: formatMessage({
                                            id: 'components.Blocks.popover.text',
                                            defaultMessage: 'Text'
                                        })
                                    }),
                                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Input, {
                                        name: "text",
                                        placeholder: formatMessage({
                                            id: 'components.Blocks.popover.text.placeholder',
                                            defaultMessage: 'Enter link text'
                                        }),
                                        value: linkText,
                                        onChange: (e)=>{
                                            setLinkText(e.target.value);
                                        }
                                    })
                                ]
                            })
                        }),
                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Root, {
                            width: "368px",
                            children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                                direction: "column",
                                gap: 1,
                                alignItems: "stretch",
                                children: [
                                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Label, {
                                        children: formatMessage({
                                            id: 'components.Blocks.popover.link',
                                            defaultMessage: 'Link'
                                        })
                                    }),
                                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Input, {
                                        ref: linkInputRef,
                                        name: "url",
                                        placeholder: formatMessage({
                                            id: 'components.Blocks.popover.link.placeholder',
                                            defaultMessage: 'Paste link'
                                        }),
                                        value: linkUrl,
                                        onChange: onLinkChange
                                    })
                                ]
                            })
                        }),
                        /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                            justifyContent: "space-between",
                            width: "100%",
                            children: [
                                /*#__PURE__*/ jsxRuntime.jsx(RemoveButton, {
                                    variant: "danger-light",
                                    onClick: ()=>links.removeLink(editor),
                                    $visible: isLastInsertedLink,
                                    children: formatMessage({
                                        id: 'components.Blocks.popover.remove',
                                        defaultMessage: 'Remove'
                                    })
                                }),
                                /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                                    gap: 2,
                                    children: [
                                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Button, {
                                            variant: "tertiary",
                                            onClick: handleClose,
                                            children: formatMessage({
                                                id: 'global.cancel',
                                                defaultMessage: 'Cancel'
                                            })
                                        }),
                                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Button, {
                                            disabled: Boolean(inputNotDirty) || isSaveDisabled,
                                            onClick: handleSave,
                                            children: formatMessage({
                                                id: 'global.save',
                                                defaultMessage: 'Save'
                                            })
                                        })
                                    ]
                                })
                            ]
                        })
                    ]
                })
            })
        ]
    });
});
const Link = /*#__PURE__*/ React__namespace.forwardRef((props, forwardedRef)=>{
    if (!types.isLinkNode(props.element)) {
        return null;
    }
    // LinkContent uses React hooks that rely on props.element being a link. If the type guard above
    // doesn't pass, those hooks would be called conditionnally, which is not allowed.
    // Hence the need for a separate component.
    return /*#__PURE__*/ jsxRuntime.jsx(LinkContent, {
        ...props,
        link: props.element,
        ref: forwardedRef
    });
});
const linkBlocks = {
    link: {
        renderElement: (props)=>/*#__PURE__*/ jsxRuntime.jsx(Link, {
                element: props.element,
                attributes: props.attributes,
                children: props.children
            }),
        // No handleConvert here, links are created via the link button in the toolbar
        matchNode: (node)=>node.type === 'link',
        isInBlocksSelector: false
    }
};

exports.linkBlocks = linkBlocks;
//# sourceMappingURL=Link.js.map
