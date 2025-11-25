import { jsx, jsxs } from 'react/jsx-runtime';
import * as React from 'react';
import { Box, Button, Popover, Flex, Field } from '@strapi/design-system';
import { useIntl } from 'react-intl';
import { Path, Range, Editor, Transforms } from 'slate';
import { ReactEditor } from 'slate-react';
import { styled } from 'styled-components';
import { useBlocksEditorContext } from '../BlocksEditor.mjs';
import { removeLink, editLink } from '../utils/links.mjs';
import { isLinkNode } from '../utils/types.mjs';

const StyledLink = styled(Box)`
  text-decoration: none;
`;
const RemoveButton = styled(Button)`
  visibility: ${(props)=>props.$visible ? 'visible' : 'hidden'};
`;
const LinkContent = /*#__PURE__*/ React.forwardRef(({ link, children, attributes }, forwardedRef)=>{
    const { formatMessage } = useIntl();
    const { editor } = useBlocksEditorContext('Link');
    const path = ReactEditor.findPath(editor, link);
    const [popoverOpen, setPopoverOpen] = React.useState(editor.lastInsertedLinkPath ? Path.equals(path, editor.lastInsertedLinkPath) : false);
    const elementText = link.children.map((child)=>child.text).join('');
    const [linkText, setLinkText] = React.useState(elementText);
    const [linkUrl, setLinkUrl] = React.useState(link.url);
    const linkInputRef = React.useRef(null);
    const isLastInsertedLink = editor.lastInsertedLinkPath ? !Path.equals(path, editor.lastInsertedLinkPath) : true;
    const [isSaveDisabled, setIsSaveDisabled] = React.useState(false);
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
        if (editor.selection && Range.isCollapsed(editor.selection)) {
            const [, parentPath] = Editor.parent(editor, editor.selection.focus?.path);
            Transforms.select(editor, parentPath);
        }
        editLink(editor, {
            url: linkUrl,
            text: linkText
        });
        setPopoverOpen(false);
        editor.lastInsertedLinkPath = null;
        ReactEditor.focus(editor);
    };
    const handleClose = ()=>{
        if (link.url === '') {
            removeLink(editor);
        }
        setPopoverOpen(false);
        ReactEditor.focus(editor);
    };
    React.useEffect(()=>{
        // Focus on the link input element when the popover opens
        if (popoverOpen) linkInputRef.current?.focus();
    }, [
        popoverOpen
    ]);
    const inputNotDirty = !linkText || !linkUrl || link.url && link.url === linkUrl && elementText && elementText === linkText;
    return /*#__PURE__*/ jsxs(Popover.Root, {
        open: popoverOpen,
        children: [
            /*#__PURE__*/ jsx(Popover.Trigger, {
                children: /*#__PURE__*/ jsx(StyledLink, {
                    ...attributes,
                    ref: forwardedRef,
                    tag: "a",
                    href: link.url,
                    onClick: ()=>setPopoverOpen(true),
                    color: "primary600",
                    children: children
                })
            }),
            /*#__PURE__*/ jsx(Popover.Content, {
                onPointerDownOutside: handleClose,
                children: /*#__PURE__*/ jsxs(Flex, {
                    padding: 4,
                    direction: "column",
                    gap: 4,
                    children: [
                        /*#__PURE__*/ jsx(Field.Root, {
                            width: "368px",
                            children: /*#__PURE__*/ jsxs(Flex, {
                                direction: "column",
                                gap: 1,
                                alignItems: "stretch",
                                children: [
                                    /*#__PURE__*/ jsx(Field.Label, {
                                        children: formatMessage({
                                            id: 'components.Blocks.popover.text',
                                            defaultMessage: 'Text'
                                        })
                                    }),
                                    /*#__PURE__*/ jsx(Field.Input, {
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
                        /*#__PURE__*/ jsx(Field.Root, {
                            width: "368px",
                            children: /*#__PURE__*/ jsxs(Flex, {
                                direction: "column",
                                gap: 1,
                                alignItems: "stretch",
                                children: [
                                    /*#__PURE__*/ jsx(Field.Label, {
                                        children: formatMessage({
                                            id: 'components.Blocks.popover.link',
                                            defaultMessage: 'Link'
                                        })
                                    }),
                                    /*#__PURE__*/ jsx(Field.Input, {
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
                        /*#__PURE__*/ jsxs(Flex, {
                            justifyContent: "space-between",
                            width: "100%",
                            children: [
                                /*#__PURE__*/ jsx(RemoveButton, {
                                    variant: "danger-light",
                                    onClick: ()=>removeLink(editor),
                                    $visible: isLastInsertedLink,
                                    children: formatMessage({
                                        id: 'components.Blocks.popover.remove',
                                        defaultMessage: 'Remove'
                                    })
                                }),
                                /*#__PURE__*/ jsxs(Flex, {
                                    gap: 2,
                                    children: [
                                        /*#__PURE__*/ jsx(Button, {
                                            variant: "tertiary",
                                            onClick: handleClose,
                                            children: formatMessage({
                                                id: 'global.cancel',
                                                defaultMessage: 'Cancel'
                                            })
                                        }),
                                        /*#__PURE__*/ jsx(Button, {
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
const Link = /*#__PURE__*/ React.forwardRef((props, forwardedRef)=>{
    if (!isLinkNode(props.element)) {
        return null;
    }
    // LinkContent uses React hooks that rely on props.element being a link. If the type guard above
    // doesn't pass, those hooks would be called conditionnally, which is not allowed.
    // Hence the need for a separate component.
    return /*#__PURE__*/ jsx(LinkContent, {
        ...props,
        link: props.element,
        ref: forwardedRef
    });
});
const linkBlocks = {
    link: {
        renderElement: (props)=>/*#__PURE__*/ jsx(Link, {
                element: props.element,
                attributes: props.attributes,
                children: props.children
            }),
        // No handleConvert here, links are created via the link button in the toolbar
        matchNode: (node)=>node.type === 'link',
        isInBlocksSelector: false
    }
};

export { linkBlocks };
//# sourceMappingURL=Link.mjs.map
