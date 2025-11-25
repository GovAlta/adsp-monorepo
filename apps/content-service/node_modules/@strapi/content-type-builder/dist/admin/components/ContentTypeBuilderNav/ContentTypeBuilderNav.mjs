import { jsxs, jsx } from 'react/jsx-runtime';
import { useState, useEffect, Fragment } from 'react';
import { SubNav, tours, ConfirmDialog } from '@strapi/admin/strapi-admin';
import { Menu, Divider, Flex, Button, VisuallyHidden, Typography, Searchbar, Box, Dialog } from '@strapi/design-system';
import { ArrowClockwise, More, Cross } from '@strapi/icons';
import { useIntl } from 'react-intl';
import { styled } from 'styled-components';
import { getTrad } from '../../utils/getTrad.mjs';
import { useDataManager } from '../DataManager/useDataManager.mjs';
import { Status } from '../Status.mjs';
import { useContentTypeBuilderMenu } from './useContentTypeBuilderMenu.mjs';

const ArrowCounterClockwise = styled(ArrowClockwise)`
  transform: scaleX(-1);
`;
const DiscardAllMenuItem = styled(Menu.Item)`
  color: ${({ theme })=>theme.colors.danger600};

  &:hover {
    background: ${({ theme, disabled })=>!disabled && theme.colors.danger100};
  }
`;
const ContentTypeBuilderNav = ()=>{
    const { menu, search } = useContentTypeBuilderMenu();
    const { saveSchema, isModified, history, isInDevelopmentMode } = useDataManager();
    const { formatMessage } = useIntl();
    const [menuIsOpen, setMenuIsOpen] = useState(false);
    const [discardConfirmationModalIsOpen, setDiscardConfirmationModalIsOpen] = useState(false);
    useEffect(()=>{
        if (!isInDevelopmentMode) {
            return;
        }
        const onKeyDown = (e)=>{
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'Enter') {
                    if (isModified) {
                        e.preventDefault();
                        saveSchema();
                    }
                } else if (e.key === 'z' && !e.shiftKey) {
                    e.preventDefault(); // Prevent browser default undo (e.g., in input fields)
                    history.undo();
                } else if (e.key === 'y' || e.shiftKey && e.key === 'z' || e.key === 'Z') {
                    e.preventDefault(); // Prevent browser default redo (e.g., in input fields)
                    history.redo();
                }
            }
        };
        document.addEventListener('keydown', onKeyDown);
        return ()=>{
            document.removeEventListener('keydown', onKeyDown);
        };
    });
    const discardHandler = ()=>{
        setDiscardConfirmationModalIsOpen(true);
    };
    const discardChanges = ()=>{
        setMenuIsOpen(false);
        setDiscardConfirmationModalIsOpen(false);
        history.discardAllChanges();
    };
    const undoHandler = ()=>{
        history.undo();
    };
    const redoHandler = ()=>{
        history.redo();
    };
    const pluginName = formatMessage({
        id: getTrad('plugin.name'),
        defaultMessage: 'Content-Type Builder'
    });
    return /*#__PURE__*/ jsxs(SubNav.Main, {
        "aria-label": pluginName,
        children: [
            /*#__PURE__*/ jsx(SubNav.Header, {
                label: pluginName
            }),
            /*#__PURE__*/ jsx(Divider, {
                background: "neutral150"
            }),
            /*#__PURE__*/ jsxs(SubNav.Content, {
                children: [
                    /*#__PURE__*/ jsxs(Flex, {
                        padding: 5,
                        gap: 3,
                        direction: 'column',
                        alignItems: 'stretch',
                        children: [
                            /*#__PURE__*/ jsx(tours.contentTypeBuilder.Save, {
                                children: /*#__PURE__*/ jsxs(Flex, {
                                    gap: 2,
                                    children: [
                                        /*#__PURE__*/ jsx(Button, {
                                            flex: 1,
                                            onClick: (e)=>{
                                                e.preventDefault();
                                                saveSchema();
                                            },
                                            type: "submit",
                                            disabled: !isModified || !isInDevelopmentMode,
                                            fullWidth: true,
                                            size: "S",
                                            children: formatMessage({
                                                id: 'global.save',
                                                defaultMessage: 'Save'
                                            })
                                        }),
                                        /*#__PURE__*/ jsxs(Menu.Root, {
                                            open: menuIsOpen,
                                            onOpenChange: setMenuIsOpen,
                                            children: [
                                                /*#__PURE__*/ jsxs(Menu.Trigger, {
                                                    size: "S",
                                                    endIcon: null,
                                                    paddingTop: "4px",
                                                    paddingLeft: "7px",
                                                    paddingRight: "7px",
                                                    variant: "tertiary",
                                                    children: [
                                                        /*#__PURE__*/ jsx(More, {
                                                            fill: "neutral500",
                                                            "aria-hidden": true,
                                                            focusable: false
                                                        }),
                                                        /*#__PURE__*/ jsx(VisuallyHidden, {
                                                            tag: "span",
                                                            children: formatMessage({
                                                                id: 'global.more.actions',
                                                                defaultMessage: 'More actions'
                                                            })
                                                        })
                                                    ]
                                                }),
                                                /*#__PURE__*/ jsxs(Menu.Content, {
                                                    zIndex: 1,
                                                    children: [
                                                        /*#__PURE__*/ jsx(Menu.Item, {
                                                            disabled: !history.canUndo || !isInDevelopmentMode,
                                                            onSelect: undoHandler,
                                                            startIcon: /*#__PURE__*/ jsx(ArrowCounterClockwise, {}),
                                                            children: formatMessage({
                                                                id: 'global.last-change.undo',
                                                                defaultMessage: 'Undo last change'
                                                            })
                                                        }),
                                                        /*#__PURE__*/ jsx(Menu.Item, {
                                                            disabled: !history.canRedo || !isInDevelopmentMode,
                                                            onSelect: redoHandler,
                                                            startIcon: /*#__PURE__*/ jsx(ArrowClockwise, {}),
                                                            children: formatMessage({
                                                                id: 'global.last-change.redo',
                                                                defaultMessage: 'Redo last change'
                                                            })
                                                        }),
                                                        /*#__PURE__*/ jsx(Menu.Separator, {}),
                                                        /*#__PURE__*/ jsx(DiscardAllMenuItem, {
                                                            disabled: !history.canDiscardAll || !isInDevelopmentMode,
                                                            onSelect: discardHandler,
                                                            children: /*#__PURE__*/ jsxs(Flex, {
                                                                gap: 2,
                                                                children: [
                                                                    /*#__PURE__*/ jsx(Cross, {}),
                                                                    /*#__PURE__*/ jsx(Typography, {
                                                                        children: formatMessage({
                                                                            id: 'global.last-changes.discard',
                                                                            defaultMessage: 'Discard last changes'
                                                                        })
                                                                    })
                                                                ]
                                                            })
                                                        })
                                                    ]
                                                })
                                            ]
                                        })
                                    ]
                                })
                            }),
                            /*#__PURE__*/ jsx(Searchbar, {
                                value: search.value,
                                onChange: (e)=>search.onChange(e.target.value),
                                onClear: ()=>search.onChange(''),
                                placeholder: formatMessage({
                                    id: getTrad('search.placeholder'),
                                    defaultMessage: 'Search'
                                }),
                                size: "S",
                                // eslint-disable-next-line react/no-children-prop
                                children: undefined,
                                name: 'search_contentType',
                                clearLabel: formatMessage({
                                    id: 'clearLabel',
                                    defaultMessage: 'Clear'
                                }),
                                "aria-label": formatMessage({
                                    id: getTrad('search.placeholder'),
                                    defaultMessage: 'Search'
                                })
                            })
                        ]
                    }),
                    /*#__PURE__*/ jsx(SubNav.Sections, {
                        children: menu.map((section)=>/*#__PURE__*/ jsx(Fragment, {
                                children: /*#__PURE__*/ jsx(SubNav.Section, {
                                    label: formatMessage({
                                        id: section.title.id,
                                        defaultMessage: section.title.defaultMessage
                                    }),
                                    link: section.customLink && {
                                        label: formatMessage({
                                            id: section.customLink?.id,
                                            defaultMessage: section.customLink?.defaultMessage
                                        }),
                                        onClick: section.customLink?.onClick
                                    },
                                    sectionId: section.name,
                                    children: section.links.map((link)=>{
                                        const linkLabel = formatMessage({
                                            id: link.name,
                                            defaultMessage: link.title
                                        });
                                        if ('links' in link) {
                                            return /*#__PURE__*/ jsx(SubNav.SubSection, {
                                                label: link.title,
                                                children: link.links.map((subLink)=>{
                                                    const label = formatMessage({
                                                        id: subLink.name,
                                                        defaultMessage: subLink.title
                                                    });
                                                    return /*#__PURE__*/ jsx(SubNav.Link, {
                                                        to: subLink.to,
                                                        label: label,
                                                        endAction: /*#__PURE__*/ jsx(Box, {
                                                            tag: "span",
                                                            textAlign: "center",
                                                            width: '24px',
                                                            children: /*#__PURE__*/ jsx(Status, {
                                                                status: subLink.status
                                                            })
                                                        })
                                                    }, subLink.name);
                                                })
                                            }, link.name);
                                        }
                                        return /*#__PURE__*/ jsx(SubNav.Link, {
                                            to: link.to,
                                            label: linkLabel,
                                            endAction: /*#__PURE__*/ jsx(Box, {
                                                tag: "span",
                                                textAlign: "center",
                                                width: '24px',
                                                children: /*#__PURE__*/ jsx(Status, {
                                                    status: link.status
                                                })
                                            })
                                        }, link.name);
                                    })
                                })
                            }, section.name))
                    })
                ]
            }),
            /*#__PURE__*/ jsx(Dialog.Root, {
                open: discardConfirmationModalIsOpen,
                onOpenChange: setDiscardConfirmationModalIsOpen,
                children: /*#__PURE__*/ jsx(ConfirmDialog, {
                    onConfirm: discardChanges,
                    children: formatMessage({
                        id: getTrad('popUpWarning.discardAll.message'),
                        defaultMessage: 'Are you sure you want to discard all changes?'
                    })
                })
            })
        ]
    });
};

export { ContentTypeBuilderNav };
//# sourceMappingURL=ContentTypeBuilderNav.mjs.map
