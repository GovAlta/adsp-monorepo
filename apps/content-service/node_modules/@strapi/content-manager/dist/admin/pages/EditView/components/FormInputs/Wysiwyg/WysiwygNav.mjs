import { jsxs, jsx, Fragment } from 'react/jsx-runtime';
import 'react';
import { IconButtonGroup, IconButton, Menu, Flex, Field, SingleSelect, SingleSelectOption, Button } from '@strapi/design-system';
import { Bold, Italic, Underline, StrikeThrough, BulletList, NumberList, Code, Image, Link, Quotes, HeadingOne, HeadingTwo, HeadingThree, HeadingFour, HeadingFive, HeadingSix } from '@strapi/icons';
import { useIntl } from 'react-intl';
import { EditorToolbarObserver } from '../../EditorToolbarObserver.mjs';
import { titleHandler, listHandler, markdownHandler, quoteAndCodeHandler } from './utils/utils.mjs';

/**
 * TODO: refactor this mess.
 */ const WysiwygNav = ({ disabled, editorRef, isPreviewMode, onToggleMediaLib, onTogglePreviewMode })=>{
    const { formatMessage } = useIntl();
    const isDisabled = disabled || isPreviewMode;
    const handleActionClick = (value, currentEditorRef)=>{
        switch(value){
            case 'Link':
                {
                    markdownHandler(currentEditorRef, value);
                    break;
                }
            case 'Code':
            case 'Quote':
                {
                    quoteAndCodeHandler(currentEditorRef, value);
                    break;
                }
            case 'Bold':
            case 'Italic':
            case 'Underline':
            case 'Strikethrough':
                {
                    markdownHandler(currentEditorRef, value);
                    break;
                }
            case 'BulletList':
            case 'NumberList':
                {
                    listHandler(currentEditorRef, value);
                    break;
                }
            case 'h1':
            case 'h2':
            case 'h3':
            case 'h4':
            case 'h5':
            case 'h6':
                {
                    titleHandler(currentEditorRef, value);
                    break;
                }
        }
    };
    const observedComponents = [
        {
            toolbar: /*#__PURE__*/ jsxs(IconButtonGroup, {
                children: [
                    /*#__PURE__*/ jsx(IconButton, {
                        disabled: isDisabled,
                        onClick: ()=>handleActionClick('Bold', editorRef),
                        label: formatMessage({
                            id: 'components.Blocks.modifiers.bold',
                            defaultMessage: 'Bold'
                        }),
                        name: formatMessage({
                            id: 'components.Blocks.modifiers.bold',
                            defaultMessage: 'Bold'
                        }),
                        children: /*#__PURE__*/ jsx(Bold, {})
                    }),
                    /*#__PURE__*/ jsx(IconButton, {
                        disabled: isDisabled,
                        onClick: ()=>handleActionClick('Italic', editorRef),
                        label: formatMessage({
                            id: 'components.Blocks.modifiers.italic',
                            defaultMessage: 'Italic'
                        }),
                        name: formatMessage({
                            id: 'components.Blocks.modifiers.italic',
                            defaultMessage: 'Italic'
                        }),
                        children: /*#__PURE__*/ jsx(Italic, {})
                    }),
                    /*#__PURE__*/ jsx(IconButton, {
                        disabled: isDisabled,
                        onClick: ()=>handleActionClick('Underline', editorRef),
                        label: formatMessage({
                            id: 'components.Blocks.modifiers.underline',
                            defaultMessage: 'Underline'
                        }),
                        name: formatMessage({
                            id: 'components.Blocks.modifiers.underline',
                            defaultMessage: 'Underline'
                        }),
                        children: /*#__PURE__*/ jsx(Underline, {})
                    }),
                    /*#__PURE__*/ jsx(IconButton, {
                        disabled: isDisabled,
                        onClick: ()=>handleActionClick('Strikethrough', editorRef),
                        label: formatMessage({
                            id: 'components.Blocks.modifiers.strikethrough',
                            defaultMessage: 'Strikethrough'
                        }),
                        name: formatMessage({
                            id: 'components.Blocks.modifiers.strikethrough',
                            defaultMessage: 'Strikethrough'
                        }),
                        children: /*#__PURE__*/ jsx(StrikeThrough, {})
                    })
                ]
            }),
            menu: /*#__PURE__*/ jsxs(Fragment, {
                children: [
                    /*#__PURE__*/ jsx(Menu.Separator, {}),
                    /*#__PURE__*/ jsx(Menu.Item, {
                        startIcon: /*#__PURE__*/ jsx(Bold, {
                            fill: "neutral500"
                        }),
                        onSelect: ()=>handleActionClick('Bold', editorRef),
                        disabled: isDisabled,
                        children: /*#__PURE__*/ jsx(Flex, {
                            tag: "span",
                            gap: 2,
                            children: formatMessage({
                                id: 'components.Blocks.modifiers.bold',
                                defaultMessage: 'Bold'
                            })
                        })
                    }),
                    /*#__PURE__*/ jsx(Menu.Item, {
                        startIcon: /*#__PURE__*/ jsx(Italic, {
                            fill: "neutral500"
                        }),
                        onSelect: ()=>handleActionClick('Italic', editorRef),
                        disabled: isDisabled,
                        children: /*#__PURE__*/ jsx(Flex, {
                            tag: "span",
                            gap: 2,
                            children: formatMessage({
                                id: 'components.Blocks.modifiers.italic',
                                defaultMessage: 'Italic'
                            })
                        })
                    }),
                    /*#__PURE__*/ jsx(Menu.Item, {
                        startIcon: /*#__PURE__*/ jsx(Underline, {
                            fill: "neutral500"
                        }),
                        onSelect: ()=>handleActionClick('Underline', editorRef),
                        disabled: isDisabled,
                        children: /*#__PURE__*/ jsx(Flex, {
                            tag: "span",
                            gap: 2,
                            children: formatMessage({
                                id: 'components.Blocks.modifiers.underline',
                                defaultMessage: 'Underline'
                            })
                        })
                    }),
                    /*#__PURE__*/ jsx(Menu.Item, {
                        startIcon: /*#__PURE__*/ jsx(StrikeThrough, {
                            fill: "neutral500"
                        }),
                        onSelect: ()=>handleActionClick('Strikethrough', editorRef),
                        disabled: isDisabled,
                        children: /*#__PURE__*/ jsx(Flex, {
                            tag: "span",
                            gap: 2,
                            children: formatMessage({
                                id: 'components.Blocks.modifiers.strikethrough',
                                defaultMessage: 'Strikethrough'
                            })
                        })
                    })
                ]
            }),
            key: 'formatting-group-1'
        },
        {
            toolbar: /*#__PURE__*/ jsxs(IconButtonGroup, {
                children: [
                    /*#__PURE__*/ jsx(IconButton, {
                        disabled: isDisabled,
                        onClick: ()=>handleActionClick('BulletList', editorRef),
                        label: formatMessage({
                            id: 'components.Blocks.blocks.bulletList',
                            defaultMessage: 'Bulleted list'
                        }),
                        name: formatMessage({
                            id: 'components.Blocks.blocks.bulletList',
                            defaultMessage: 'Bulleted list'
                        }),
                        children: /*#__PURE__*/ jsx(BulletList, {})
                    }),
                    /*#__PURE__*/ jsx(IconButton, {
                        disabled: isDisabled,
                        onClick: ()=>handleActionClick('NumberList', editorRef),
                        label: formatMessage({
                            id: 'components.Blocks.blocks.numberList',
                            defaultMessage: 'Numbered list'
                        }),
                        name: formatMessage({
                            id: 'components.Blocks.blocks.numberList',
                            defaultMessage: 'Numbered list'
                        }),
                        children: /*#__PURE__*/ jsx(NumberList, {})
                    })
                ]
            }),
            menu: /*#__PURE__*/ jsxs(Fragment, {
                children: [
                    /*#__PURE__*/ jsx(Menu.Separator, {}),
                    /*#__PURE__*/ jsx(Menu.Item, {
                        startIcon: /*#__PURE__*/ jsx(BulletList, {
                            fill: "neutral500"
                        }),
                        onSelect: ()=>handleActionClick('BulletList', editorRef),
                        disabled: isDisabled,
                        children: /*#__PURE__*/ jsx(Flex, {
                            tag: "span",
                            gap: 2,
                            children: formatMessage({
                                id: 'components.Blocks.blocks.unorderedList',
                                defaultMessage: 'Bulleted list'
                            })
                        })
                    }),
                    /*#__PURE__*/ jsx(Menu.Item, {
                        startIcon: /*#__PURE__*/ jsx(NumberList, {
                            fill: "neutral500"
                        }),
                        onSelect: ()=>handleActionClick('NumberList', editorRef),
                        disabled: isDisabled,
                        children: /*#__PURE__*/ jsx(Flex, {
                            tag: "span",
                            gap: 2,
                            children: formatMessage({
                                id: 'components.Blocks.blocks.orderedList',
                                defaultMessage: 'Numbered list'
                            })
                        })
                    })
                ]
            }),
            key: 'formatting-group-2'
        },
        {
            toolbar: /*#__PURE__*/ jsxs(IconButtonGroup, {
                children: [
                    /*#__PURE__*/ jsx(IconButton, {
                        disabled: isDisabled,
                        onClick: ()=>handleActionClick('Code', editorRef),
                        label: formatMessage({
                            id: 'components.Wysiwyg.blocks.code',
                            defaultMessage: 'Code'
                        }),
                        name: formatMessage({
                            id: 'components.Wysiwyg.blocks.code',
                            defaultMessage: 'Code'
                        }),
                        children: /*#__PURE__*/ jsx(Code, {})
                    }),
                    /*#__PURE__*/ jsx(IconButton, {
                        disabled: isDisabled,
                        onClick: ()=>{
                            onToggleMediaLib();
                        },
                        label: formatMessage({
                            id: 'components.Blocks.blocks.image',
                            defaultMessage: 'Image'
                        }),
                        name: formatMessage({
                            id: 'components.Blocks.blocks.image',
                            defaultMessage: 'Image'
                        }),
                        children: /*#__PURE__*/ jsx(Image, {})
                    }),
                    /*#__PURE__*/ jsx(IconButton, {
                        disabled: isDisabled,
                        onClick: ()=>handleActionClick('Link', editorRef),
                        label: formatMessage({
                            id: 'components.Blocks.popover.link',
                            defaultMessage: 'Link'
                        }),
                        name: formatMessage({
                            id: 'components.Blocks.popover.link',
                            defaultMessage: 'Link'
                        }),
                        children: /*#__PURE__*/ jsx(Link, {})
                    }),
                    /*#__PURE__*/ jsx(IconButton, {
                        disabled: isDisabled,
                        onClick: ()=>handleActionClick('Quote', editorRef),
                        label: formatMessage({
                            id: 'components.Blocks.blocks.quote',
                            defaultMessage: 'Quote'
                        }),
                        name: formatMessage({
                            id: 'components.Blocks.blocks.quote',
                            defaultMessage: 'Quote'
                        }),
                        children: /*#__PURE__*/ jsx(Quotes, {})
                    })
                ]
            }),
            menu: /*#__PURE__*/ jsxs(Fragment, {
                children: [
                    /*#__PURE__*/ jsx(Menu.Separator, {}),
                    /*#__PURE__*/ jsx(Menu.Item, {
                        startIcon: /*#__PURE__*/ jsx(Code, {
                            fill: "neutral500"
                        }),
                        onSelect: ()=>handleActionClick('Code', editorRef),
                        disabled: isDisabled,
                        children: /*#__PURE__*/ jsx(Flex, {
                            tag: "span",
                            gap: 2,
                            children: formatMessage({
                                id: 'components.Wysiwyg.blocks.code',
                                defaultMessage: 'Code'
                            })
                        })
                    }),
                    /*#__PURE__*/ jsx(Menu.Item, {
                        startIcon: /*#__PURE__*/ jsx(Image, {
                            fill: "neutral500"
                        }),
                        onSelect: ()=>{
                            onToggleMediaLib();
                        },
                        disabled: isDisabled,
                        children: /*#__PURE__*/ jsx(Flex, {
                            tag: "span",
                            gap: 2,
                            children: formatMessage({
                                id: 'components.Blocks.blocks.image',
                                defaultMessage: 'Image'
                            })
                        })
                    }),
                    /*#__PURE__*/ jsx(Menu.Item, {
                        startIcon: /*#__PURE__*/ jsx(Link, {
                            fill: "neutral500"
                        }),
                        onSelect: ()=>handleActionClick('Link', editorRef),
                        disabled: isDisabled,
                        children: /*#__PURE__*/ jsx(Flex, {
                            tag: "span",
                            gap: 2,
                            children: formatMessage({
                                id: 'components.Blocks.popover.link',
                                defaultMessage: 'Link'
                            })
                        })
                    }),
                    /*#__PURE__*/ jsx(Menu.Item, {
                        startIcon: /*#__PURE__*/ jsx(Quotes, {
                            fill: "neutral500"
                        }),
                        onSelect: ()=>handleActionClick('Quote', editorRef),
                        disabled: isDisabled,
                        children: /*#__PURE__*/ jsx(Flex, {
                            tag: "span",
                            gap: 2,
                            children: formatMessage({
                                id: 'components.Blocks.blocks.quote',
                                defaultMessage: 'Quote'
                            })
                        })
                    })
                ]
            }),
            key: 'formatting-group-3'
        }
    ];
    return /*#__PURE__*/ jsxs(Flex, {
        padding: 2,
        background: "neutral100",
        justifyContent: "space-between",
        borderRadius: "0.4rem 0.4rem 0 0",
        width: "100%",
        gap: 4,
        children: [
            /*#__PURE__*/ jsx(Field.Root, {
                children: /*#__PURE__*/ jsxs(SingleSelect, {
                    disabled: isDisabled,
                    placeholder: formatMessage({
                        id: 'components.Wysiwyg.selectOptions.title',
                        defaultMessage: 'Headings'
                    }),
                    "aria-label": formatMessage({
                        id: 'components.Wysiwyg.selectOptions.title',
                        defaultMessage: 'Headings'
                    }),
                    // @ts-expect-error – DS v2 will only allow strings.
                    onChange: (value)=>handleActionClick(value, editorRef),
                    size: "S",
                    children: [
                        /*#__PURE__*/ jsx(SingleSelectOption, {
                            value: "h1",
                            startIcon: /*#__PURE__*/ jsx(HeadingOne, {
                                fill: "neutral500"
                            }),
                            children: formatMessage({
                                id: 'components.Wysiwyg.selectOptions.H1',
                                defaultMessage: 'Heading 1'
                            })
                        }),
                        /*#__PURE__*/ jsx(SingleSelectOption, {
                            value: "h2",
                            startIcon: /*#__PURE__*/ jsx(HeadingTwo, {
                                fill: "neutral500"
                            }),
                            children: formatMessage({
                                id: 'components.Wysiwyg.selectOptions.H2',
                                defaultMessage: 'Heading 2'
                            })
                        }),
                        /*#__PURE__*/ jsx(SingleSelectOption, {
                            value: "h3",
                            startIcon: /*#__PURE__*/ jsx(HeadingThree, {
                                fill: "neutral500"
                            }),
                            children: formatMessage({
                                id: 'components.Wysiwyg.selectOptions.H3',
                                defaultMessage: 'Heading 3'
                            })
                        }),
                        /*#__PURE__*/ jsx(SingleSelectOption, {
                            value: "h4",
                            startIcon: /*#__PURE__*/ jsx(HeadingFour, {
                                fill: "neutral500"
                            }),
                            children: formatMessage({
                                id: 'components.Wysiwyg.selectOptions.H4',
                                defaultMessage: 'Heading 4'
                            })
                        }),
                        /*#__PURE__*/ jsx(SingleSelectOption, {
                            value: "h5",
                            startIcon: /*#__PURE__*/ jsx(HeadingFive, {
                                fill: "neutral500"
                            }),
                            children: formatMessage({
                                id: 'components.Wysiwyg.selectOptions.H5',
                                defaultMessage: 'Heading 5'
                            })
                        }),
                        /*#__PURE__*/ jsx(SingleSelectOption, {
                            value: "h6",
                            startIcon: /*#__PURE__*/ jsx(HeadingSix, {
                                fill: "neutral500"
                            }),
                            children: formatMessage({
                                id: 'components.Wysiwyg.selectOptions.H6',
                                defaultMessage: 'Heading 6'
                            })
                        })
                    ]
                })
            }),
            /*#__PURE__*/ jsxs(Flex, {
                width: "100%",
                justifyContent: "space-between",
                overflow: "hidden",
                children: [
                    /*#__PURE__*/ jsx(Flex, {
                        gap: 2,
                        overflow: "hidden",
                        width: "100%",
                        children: /*#__PURE__*/ jsx(EditorToolbarObserver, {
                            menuTriggerVariant: "tertiary",
                            observedComponents: observedComponents
                        })
                    }),
                    onTogglePreviewMode && /*#__PURE__*/ jsx(Button, {
                        onClick: onTogglePreviewMode,
                        variant: "tertiary",
                        minWidth: "132px",
                        children: isPreviewMode ? formatMessage({
                            id: 'components.Wysiwyg.ToggleMode.markdown-mode',
                            defaultMessage: 'Markdown mode'
                        }) : formatMessage({
                            id: 'components.Wysiwyg.ToggleMode.preview-mode',
                            defaultMessage: 'Preview mode'
                        })
                    })
                ]
            })
        ]
    });
};

export { WysiwygNav };
//# sourceMappingURL=WysiwygNav.mjs.map
