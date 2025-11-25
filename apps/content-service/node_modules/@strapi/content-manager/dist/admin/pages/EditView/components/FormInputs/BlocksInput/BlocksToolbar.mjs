import { jsx, jsxs, Fragment } from 'react/jsx-runtime';
import * as React from 'react';
import * as Toolbar from '@radix-ui/react-toolbar';
import { Flex, Box, Menu, Tooltip, SingleSelect, SingleSelectOption } from '@strapi/design-system';
import { Link } from '@strapi/icons';
import { useIntl } from 'react-intl';
import { Editor, Transforms, Node, Element } from 'slate';
import { ReactEditor } from 'slate-react';
import { styled, css } from 'styled-components';
import { EditorToolbarObserver } from '../../EditorToolbarObserver.mjs';
import { useBlocksEditorContext, isSelectorBlockKey } from './BlocksEditor.mjs';
import { insertLink } from './utils/links.mjs';
import { getEntries, getKeys } from './utils/types.mjs';

const ToolbarWrapper = styled(Flex)`
  &[aria-disabled='true'] {
    cursor: not-allowed;
    background: ${({ theme })=>theme.colors.neutral150};
  }
`;
const ToolbarSeparator = styled(Toolbar.Separator)`
  background: ${({ theme })=>theme.colors.neutral150};
  width: 1px;
  height: 2.4rem;
  margin-left: 0.8rem;
  margin-right: 0.8rem;
`;
const FlexButton = styled(Flex)`
  // Inherit the not-allowed cursor from ToolbarWrapper when disabled
  &[aria-disabled] {
    cursor: not-allowed;
  }

  &[aria-disabled='false'] {
    cursor: pointer;

    // Only apply hover styles if the button is enabled
    &:hover {
      background: ${({ theme })=>theme.colors.primary100};
    }
  }
`;
const SelectWrapper = styled(Box)`
  // Styling changes to SingleSelect component don't work, so adding wrapper to target SingleSelect
  div[role='combobox'] {
    border: none;
    cursor: pointer;
    min-height: unset;
    padding-top: 6px;
    padding-bottom: 6px;

    &[aria-disabled='false']:hover {
      cursor: pointer;
      background: ${({ theme })=>theme.colors.primary100};
    }

    &[aria-disabled] {
      background: transparent;
      cursor: inherit;

      // Select text and icons should also have disabled color
      span {
        color: ${({ theme })=>theme.colors.neutral600};
      }
    }
  }
`;
/**
 * Handles the modal component that may be returned by a block when converting it
 */ function useConversionModal() {
    const [modalElement, setModalComponent] = React.useState(null);
    const handleConversionResult = (renderModal)=>{
        // Not all blocks return a modal
        if (renderModal) {
            // Use cloneElement to apply a key because to create a new instance of the component
            // Without the new key, the state is kept from previous times that option was picked
            setModalComponent(/*#__PURE__*/ React.cloneElement(renderModal(), {
                key: Date.now()
            }));
        }
    };
    return {
        modalElement,
        handleConversionResult
    };
}
const ToolbarButton = ({ icon: Icon, name, label, isActive, disabled, handleClick })=>{
    const { editor } = useBlocksEditorContext('ToolbarButton');
    const { formatMessage } = useIntl();
    const labelMessage = formatMessage(label);
    const enabledColor = isActive ? 'primary600' : 'neutral600';
    return /*#__PURE__*/ jsx(Tooltip, {
        label: labelMessage,
        children: /*#__PURE__*/ jsx(Toolbar.ToggleItem, {
            value: name,
            "data-state": isActive ? 'on' : 'off',
            onMouseDown: (e)=>{
                e.preventDefault();
                handleClick();
                ReactEditor.focus(editor);
            },
            "aria-disabled": disabled,
            disabled: disabled,
            "aria-label": labelMessage,
            asChild: true,
            children: /*#__PURE__*/ jsx(FlexButton, {
                tag: "button",
                background: isActive ? 'primary100' : '',
                alignItems: "center",
                justifyContent: "center",
                width: 7,
                height: 7,
                hasRadius: true,
                children: /*#__PURE__*/ jsx(Icon, {
                    fill: disabled ? 'neutral300' : enabledColor
                })
            })
        })
    });
};
const BlocksDropdown = ()=>{
    const { editor, blocks, disabled } = useBlocksEditorContext('BlocksDropdown');
    const { formatMessage } = useIntl();
    const { modalElement, handleConversionResult } = useConversionModal();
    const blockKeysToInclude = getEntries(blocks).reduce((currentKeys, entry)=>{
        const [key, block] = entry;
        return block.isInBlocksSelector ? [
            ...currentKeys,
            key
        ] : currentKeys;
    }, []);
    const [blockSelected, setBlockSelected] = React.useState('paragraph');
    const handleSelect = (optionKey)=>{
        if (!isSelectorBlockKey(optionKey)) {
            return;
        }
        const editorIsEmpty = editor.children.length === 1 && Editor.isEmpty(editor, editor.children[0]);
        if (!editor.selection && !editorIsEmpty) {
            // When there is no selection, create an empty block at the end of the editor
            // so that it can be converted to the selected block
            Transforms.insertNodes(editor, {
                type: 'quote',
                children: [
                    {
                        type: 'text',
                        text: ''
                    }
                ]
            }, {
                select: true
            });
        } else if (!editor.selection && editorIsEmpty) {
            // When there is no selection and the editor is empty,
            // select the empty paragraph from Slate's initialValue so it gets converted
            Transforms.select(editor, Editor.start(editor, [
                0,
                0
            ]));
        }
        // If selection is already a list block, toggle its format
        const currentListEntry = Editor.above(editor, {
            match: (node)=>!Editor.isEditor(node) && node.type === 'list'
        });
        if (currentListEntry && [
            'list-ordered',
            'list-unordered'
        ].includes(optionKey)) {
            const [currentList, currentListPath] = currentListEntry;
            const format = optionKey === 'list-ordered' ? 'ordered' : 'unordered';
            if (!Editor.isEditor(currentList) && isListNode(currentList)) {
                // Format is different, toggle list format
                if (currentList.format !== format) {
                    Transforms.setNodes(editor, {
                        format
                    }, {
                        at: currentListPath
                    });
                }
            }
            return;
        }
        // Let the block handle the Slate conversion logic
        const maybeRenderModal = blocks[optionKey].handleConvert?.(editor);
        handleConversionResult(maybeRenderModal);
        setBlockSelected(optionKey);
        ReactEditor.focus(editor);
    };
    /**
   * Prevent the select from focusing itself so ReactEditor.focus(editor) can focus the editor instead.
   *
   * The editor first loses focus to a blur event when clicking the select button. However,
   * refocusing the editor is not enough since the select's default behavior is to refocus itself
   * after an option is selected.
   *
   */ const preventSelectFocus = (e)=>e.preventDefault();
    // Listen to the selection change and update the selected block in the dropdown
    React.useEffect(()=>{
        if (editor.selection) {
            let selectedNode;
            // If selection anchor is a list-item, get its parent
            const currentListEntry = Editor.above(editor, {
                match: (node)=>!Editor.isEditor(node) && node.type === 'list',
                at: editor.selection.anchor
            });
            if (currentListEntry) {
                const [currentList] = currentListEntry;
                selectedNode = currentList;
            } else {
                // Get the parent node of the anchor other than list-item
                const [anchorNode] = Editor.parent(editor, editor.selection.anchor, {
                    edge: 'start',
                    depth: 2
                });
                // @ts-expect-error slate's delete behaviour creates an exceptional type
                if (anchorNode.type === 'list-item') {
                    // When the last node in the selection is a list item,
                    // slate's default delete operation leaves an empty list-item instead of converting it into a paragraph.
                    // Issue: https://github.com/ianstormtaylor/slate/issues/2500
                    Transforms.setNodes(editor, {
                        type: 'paragraph'
                    });
                    // @ts-expect-error convert explicitly type to paragraph
                    selectedNode = {
                        ...anchorNode,
                        type: 'paragraph'
                    };
                } else {
                    selectedNode = anchorNode;
                }
            }
            // Find the block key that matches the anchor node
            const anchorBlockKey = getKeys(blocks).find((blockKey)=>!Editor.isEditor(selectedNode) && blocks[blockKey].matchNode(selectedNode));
            // Change the value selected in the dropdown if it doesn't match the anchor block key
            if (anchorBlockKey && anchorBlockKey !== blockSelected) {
                setBlockSelected(anchorBlockKey);
            }
        }
    }, [
        editor.selection,
        editor,
        blocks,
        blockSelected
    ]);
    const Icon = blocks[blockSelected].icon;
    return /*#__PURE__*/ jsxs(Fragment, {
        children: [
            /*#__PURE__*/ jsx(SelectWrapper, {
                children: /*#__PURE__*/ jsx(SingleSelect, {
                    startIcon: /*#__PURE__*/ jsx(Icon, {}),
                    onChange: handleSelect,
                    placeholder: formatMessage(blocks[blockSelected].label),
                    value: blockSelected,
                    onCloseAutoFocus: preventSelectFocus,
                    "aria-label": formatMessage({
                        id: 'components.Blocks.blocks.selectBlock',
                        defaultMessage: 'Select a block'
                    }),
                    disabled: disabled,
                    children: blockKeysToInclude.map((key)=>/*#__PURE__*/ jsx(BlockOption, {
                            value: key,
                            label: blocks[key].label,
                            icon: blocks[key].icon,
                            blockSelected: blockSelected
                        }, key))
                })
            }),
            modalElement
        ]
    });
};
const BlockOption = ({ value, icon: Icon, label, blockSelected })=>{
    const { formatMessage } = useIntl();
    const isSelected = value === blockSelected;
    return /*#__PURE__*/ jsx(SingleSelectOption, {
        startIcon: /*#__PURE__*/ jsx(Icon, {
            fill: isSelected ? 'primary600' : 'neutral500'
        }),
        value: value,
        children: formatMessage(label)
    });
};
const isListNode = (node)=>{
    return Node.isNode(node) && !Editor.isEditor(node) && node.type === 'list';
};
const ListButton = ({ block, format, location = 'toolbar' })=>{
    const { formatMessage } = useIntl();
    const { editor, disabled, blocks } = useBlocksEditorContext('ListButton');
    const isListActive = ()=>{
        if (!editor.selection) return false;
        // Get the parent list at selection anchor node
        const currentListEntry = Editor.above(editor, {
            match: (node)=>!Editor.isEditor(node) && node.type === 'list',
            at: editor.selection.anchor
        });
        if (currentListEntry) {
            const [currentList] = currentListEntry;
            if (!Editor.isEditor(currentList) && isListNode(currentList) && currentList.format === format) return true;
        }
        return false;
    };
    /**
   * @TODO: Currently, applying list while multiple blocks are selected is not supported.
   * We should implement this feature in the future.
   */ const isListDisabled = ()=>{
        // Always disabled when the whole editor is disabled
        if (disabled) {
            return true;
        }
        // Always enabled when there's no selection
        if (!editor.selection) {
            return false;
        }
        // Get the block node closest to the anchor and focus
        const anchorNodeEntry = Editor.above(editor, {
            at: editor.selection.anchor,
            match: (node)=>!Editor.isEditor(node) && node.type !== 'text'
        });
        const focusNodeEntry = Editor.above(editor, {
            at: editor.selection.focus,
            match: (node)=>!Editor.isEditor(node) && node.type !== 'text'
        });
        if (!anchorNodeEntry || !focusNodeEntry) {
            return false;
        }
        // Disabled if the anchor and focus are not in the same block
        return anchorNodeEntry[0] !== focusNodeEntry[0];
    };
    const toggleList = (format)=>{
        let currentListEntry;
        if (editor.selection) {
            currentListEntry = Editor.above(editor, {
                match: (node)=>!Editor.isEditor(node) && node.type === 'list'
            });
        } else {
            // If no selection, toggle last inserted node
            const [_, lastNodePath] = Editor.last(editor, []);
            currentListEntry = Editor.above(editor, {
                match: (node)=>!Editor.isEditor(node) && node.type === 'list',
                at: lastNodePath
            });
        }
        if (!currentListEntry) {
            // If selection is not a list then convert it to list
            blocks[`list-${format}`].handleConvert(editor);
            return;
        }
        // If selection is already a list then toggle format
        const [currentList, currentListPath] = currentListEntry;
        if (!Editor.isEditor(currentList) && isListNode(currentList)) {
            if (currentList.format !== format) {
                // Format is different, toggle list format
                Transforms.setNodes(editor, {
                    format
                }, {
                    at: currentListPath
                });
            } else {
                // Format is same, convert selected list-item to paragraph
                blocks['paragraph'].handleConvert(editor);
            }
        }
    };
    if (location === 'menu') {
        const Icon = block.icon;
        return /*#__PURE__*/ jsx(StyledMenuItem, {
            startIcon: /*#__PURE__*/ jsx(Icon, {}),
            onSelect: ()=>toggleList(format),
            isActive: isListActive(),
            disabled: isListDisabled(),
            children: formatMessage(block.label)
        });
    }
    return /*#__PURE__*/ jsx(ToolbarButton, {
        icon: block.icon,
        name: format,
        label: block.label,
        isActive: isListActive(),
        disabled: isListDisabled(),
        handleClick: ()=>toggleList(format)
    });
};
const LinkButton = ({ disabled, location = 'toolbar' })=>{
    const { editor } = useBlocksEditorContext('LinkButton');
    const { formatMessage } = useIntl();
    const isLinkActive = ()=>{
        const { selection } = editor;
        if (!selection) return false;
        const [match] = Array.from(Editor.nodes(editor, {
            at: Editor.unhangRange(editor, selection),
            match: (node)=>Element.isElement(node) && node.type === 'link'
        }));
        return Boolean(match);
    };
    const isLinkDisabled = ()=>{
        // Always disabled when the whole editor is disabled
        if (disabled) {
            return true;
        }
        // Always enabled when there's no selection
        if (!editor.selection) {
            return false;
        }
        // Get the block node closest to the anchor and focus
        const anchorNodeEntry = Editor.above(editor, {
            at: editor.selection.anchor,
            match: (node)=>!Editor.isEditor(node) && node.type !== 'text'
        });
        const focusNodeEntry = Editor.above(editor, {
            at: editor.selection.focus,
            match: (node)=>!Editor.isEditor(node) && node.type !== 'text'
        });
        if (!anchorNodeEntry || !focusNodeEntry) {
            return false;
        }
        // Disabled if the anchor and focus are not in the same block
        return anchorNodeEntry[0] !== focusNodeEntry[0];
    };
    const addLink = ()=>{
        editor.shouldSaveLinkPath = true;
        // We insert an empty anchor, so we split the DOM to have a element we can use as reference for the popover
        insertLink(editor, {
            url: ''
        });
    };
    const label = {
        id: 'components.Blocks.link',
        defaultMessage: 'Link'
    };
    if (location === 'menu') {
        return /*#__PURE__*/ jsx(StyledMenuItem, {
            startIcon: /*#__PURE__*/ jsx(Link, {}),
            onSelect: addLink,
            isActive: isLinkActive(),
            disabled: isLinkDisabled(),
            children: formatMessage(label)
        });
    }
    return /*#__PURE__*/ jsx(ToolbarButton, {
        icon: Link,
        name: "link",
        label: label,
        isActive: isLinkActive(),
        handleClick: addLink,
        disabled: isLinkDisabled()
    });
};
const StyledMenuItem = styled(Menu.Item)`
  ${(props)=>props.isActive && css`
      color: ${({ theme })=>theme.colors.primary600};
      font-weight: 600;
    `}

  svg {
    fill: ${({ theme, isActive })=>isActive ? theme.colors.primary600 : theme.colors.neutral500};
  }
`;
const BlocksToolbar = ()=>{
    const { editor, blocks, modifiers, disabled } = useBlocksEditorContext('BlocksToolbar');
    const { formatMessage } = useIntl();
    /**
   * The modifier buttons are disabled when an image is selected.
   */ const checkButtonDisabled = ()=>{
        // Always disabled when the whole editor is disabled
        if (disabled) {
            return true;
        }
        if (!editor.selection) {
            return false;
        }
        const selectedNode = editor.children[editor.selection.anchor.path[0]];
        if (!selectedNode) return true;
        if ([
            'image',
            'code'
        ].includes(selectedNode.type)) {
            return true;
        }
        return false;
    };
    const isButtonDisabled = checkButtonDisabled();
    /**
   * Observed components are ones that may or may not be visible in the toolbar, depending on the
   * available space. They provide two render props:
   * - renderInToolbar: for when we try to render the component in the toolbar (may be hidden)
   * - renderInMenu: for when the component didn't fit in the toolbar and is relegated
   *   to the "more" menu
   */ const observedComponents = [
        ...Object.entries(modifiers).map(([name, modifier])=>{
            const Icon = modifier.icon;
            const isActive = modifier.checkIsActive(editor);
            const handleSelect = ()=>modifier.handleToggle(editor);
            return {
                toolbar: /*#__PURE__*/ jsx(ToolbarButton, {
                    name: name,
                    icon: modifier.icon,
                    label: modifier.label,
                    isActive: modifier.checkIsActive(editor),
                    handleClick: handleSelect,
                    disabled: isButtonDisabled
                }, name),
                menu: /*#__PURE__*/ jsx(StyledMenuItem, {
                    startIcon: /*#__PURE__*/ jsx(Icon, {}),
                    onSelect: handleSelect,
                    isActive: isActive,
                    children: formatMessage(modifier.label)
                }),
                key: `modifier.${name}`
            };
        }),
        {
            toolbar: /*#__PURE__*/ jsx(LinkButton, {
                disabled: isButtonDisabled,
                location: "toolbar"
            }),
            menu: /*#__PURE__*/ jsx(LinkButton, {
                disabled: isButtonDisabled,
                location: "menu"
            }),
            key: 'block.link'
        },
        {
            // List buttons can only be rendered together when in the toolbar
            toolbar: /*#__PURE__*/ jsxs(Flex, {
                direction: "row",
                children: [
                    /*#__PURE__*/ jsx(ToolbarSeparator, {
                        style: {
                            marginLeft: '0.4rem'
                        }
                    }),
                    /*#__PURE__*/ jsx(Toolbar.ToggleGroup, {
                        type: "single",
                        asChild: true,
                        children: /*#__PURE__*/ jsxs(Flex, {
                            gap: 1,
                            children: [
                                /*#__PURE__*/ jsx(ListButton, {
                                    block: blocks['list-unordered'],
                                    format: "unordered",
                                    location: "toolbar"
                                }),
                                /*#__PURE__*/ jsx(ListButton, {
                                    block: blocks['list-ordered'],
                                    format: "ordered",
                                    location: "toolbar"
                                })
                            ]
                        })
                    })
                ]
            }),
            menu: /*#__PURE__*/ jsxs(Fragment, {
                children: [
                    /*#__PURE__*/ jsx(Menu.Separator, {}),
                    /*#__PURE__*/ jsx(ListButton, {
                        block: blocks['list-unordered'],
                        format: "unordered",
                        location: "menu"
                    }),
                    /*#__PURE__*/ jsx(ListButton, {
                        block: blocks['list-ordered'],
                        format: "ordered",
                        location: "menu"
                    })
                ]
            }),
            key: 'block.list'
        }
    ];
    return /*#__PURE__*/ jsx(Toolbar.Root, {
        "aria-disabled": disabled,
        asChild: true,
        children: /*#__PURE__*/ jsxs(ToolbarWrapper, {
            padding: 2,
            width: "100%",
            children: [
                /*#__PURE__*/ jsx(BlocksDropdown, {}),
                /*#__PURE__*/ jsx(ToolbarSeparator, {}),
                /*#__PURE__*/ jsx(Toolbar.ToggleGroup, {
                    type: "multiple",
                    asChild: true,
                    children: /*#__PURE__*/ jsx(Flex, {
                        direction: "row",
                        gap: 1,
                        grow: 1,
                        overflow: "hidden",
                        children: /*#__PURE__*/ jsx(EditorToolbarObserver, {
                            observedComponents: observedComponents
                        })
                    })
                })
            ]
        })
    });
};

export { BlocksToolbar, useConversionModal };
//# sourceMappingURL=BlocksToolbar.mjs.map
