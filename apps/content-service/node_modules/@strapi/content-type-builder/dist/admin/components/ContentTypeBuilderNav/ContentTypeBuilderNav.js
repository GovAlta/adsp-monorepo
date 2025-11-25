'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var strapiAdmin = require('@strapi/admin/strapi-admin');
var designSystem = require('@strapi/design-system');
var Icons = require('@strapi/icons');
var reactIntl = require('react-intl');
var styledComponents = require('styled-components');
var getTrad = require('../../utils/getTrad.js');
var useDataManager = require('../DataManager/useDataManager.js');
var Status = require('../Status.js');
var useContentTypeBuilderMenu = require('./useContentTypeBuilderMenu.js');

const ArrowCounterClockwise = styledComponents.styled(Icons.ArrowClockwise)`
  transform: scaleX(-1);
`;
const DiscardAllMenuItem = styledComponents.styled(designSystem.Menu.Item)`
  color: ${({ theme })=>theme.colors.danger600};

  &:hover {
    background: ${({ theme, disabled })=>!disabled && theme.colors.danger100};
  }
`;
const ContentTypeBuilderNav = ()=>{
    const { menu, search } = useContentTypeBuilderMenu.useContentTypeBuilderMenu();
    const { saveSchema, isModified, history, isInDevelopmentMode } = useDataManager.useDataManager();
    const { formatMessage } = reactIntl.useIntl();
    const [menuIsOpen, setMenuIsOpen] = React.useState(false);
    const [discardConfirmationModalIsOpen, setDiscardConfirmationModalIsOpen] = React.useState(false);
    React.useEffect(()=>{
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
        id: getTrad.getTrad('plugin.name'),
        defaultMessage: 'Content-Type Builder'
    });
    return /*#__PURE__*/ jsxRuntime.jsxs(strapiAdmin.SubNav.Main, {
        "aria-label": pluginName,
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.SubNav.Header, {
                label: pluginName
            }),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Divider, {
                background: "neutral150"
            }),
            /*#__PURE__*/ jsxRuntime.jsxs(strapiAdmin.SubNav.Content, {
                children: [
                    /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                        padding: 5,
                        gap: 3,
                        direction: 'column',
                        alignItems: 'stretch',
                        children: [
                            /*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.tours.contentTypeBuilder.Save, {
                                children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                                    gap: 2,
                                    children: [
                                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Button, {
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
                                        /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Menu.Root, {
                                            open: menuIsOpen,
                                            onOpenChange: setMenuIsOpen,
                                            children: [
                                                /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Menu.Trigger, {
                                                    size: "S",
                                                    endIcon: null,
                                                    paddingTop: "4px",
                                                    paddingLeft: "7px",
                                                    paddingRight: "7px",
                                                    variant: "tertiary",
                                                    children: [
                                                        /*#__PURE__*/ jsxRuntime.jsx(Icons.More, {
                                                            fill: "neutral500",
                                                            "aria-hidden": true,
                                                            focusable: false
                                                        }),
                                                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.VisuallyHidden, {
                                                            tag: "span",
                                                            children: formatMessage({
                                                                id: 'global.more.actions',
                                                                defaultMessage: 'More actions'
                                                            })
                                                        })
                                                    ]
                                                }),
                                                /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Menu.Content, {
                                                    zIndex: 1,
                                                    children: [
                                                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Menu.Item, {
                                                            disabled: !history.canUndo || !isInDevelopmentMode,
                                                            onSelect: undoHandler,
                                                            startIcon: /*#__PURE__*/ jsxRuntime.jsx(ArrowCounterClockwise, {}),
                                                            children: formatMessage({
                                                                id: 'global.last-change.undo',
                                                                defaultMessage: 'Undo last change'
                                                            })
                                                        }),
                                                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Menu.Item, {
                                                            disabled: !history.canRedo || !isInDevelopmentMode,
                                                            onSelect: redoHandler,
                                                            startIcon: /*#__PURE__*/ jsxRuntime.jsx(Icons.ArrowClockwise, {}),
                                                            children: formatMessage({
                                                                id: 'global.last-change.redo',
                                                                defaultMessage: 'Redo last change'
                                                            })
                                                        }),
                                                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Menu.Separator, {}),
                                                        /*#__PURE__*/ jsxRuntime.jsx(DiscardAllMenuItem, {
                                                            disabled: !history.canDiscardAll || !isInDevelopmentMode,
                                                            onSelect: discardHandler,
                                                            children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                                                                gap: 2,
                                                                children: [
                                                                    /*#__PURE__*/ jsxRuntime.jsx(Icons.Cross, {}),
                                                                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
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
                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Searchbar, {
                                value: search.value,
                                onChange: (e)=>search.onChange(e.target.value),
                                onClear: ()=>search.onChange(''),
                                placeholder: formatMessage({
                                    id: getTrad.getTrad('search.placeholder'),
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
                                    id: getTrad.getTrad('search.placeholder'),
                                    defaultMessage: 'Search'
                                })
                            })
                        ]
                    }),
                    /*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.SubNav.Sections, {
                        children: menu.map((section)=>/*#__PURE__*/ jsxRuntime.jsx(React.Fragment, {
                                children: /*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.SubNav.Section, {
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
                                            return /*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.SubNav.SubSection, {
                                                label: link.title,
                                                children: link.links.map((subLink)=>{
                                                    const label = formatMessage({
                                                        id: subLink.name,
                                                        defaultMessage: subLink.title
                                                    });
                                                    return /*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.SubNav.Link, {
                                                        to: subLink.to,
                                                        label: label,
                                                        endAction: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                                                            tag: "span",
                                                            textAlign: "center",
                                                            width: '24px',
                                                            children: /*#__PURE__*/ jsxRuntime.jsx(Status.Status, {
                                                                status: subLink.status
                                                            })
                                                        })
                                                    }, subLink.name);
                                                })
                                            }, link.name);
                                        }
                                        return /*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.SubNav.Link, {
                                            to: link.to,
                                            label: linkLabel,
                                            endAction: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                                                tag: "span",
                                                textAlign: "center",
                                                width: '24px',
                                                children: /*#__PURE__*/ jsxRuntime.jsx(Status.Status, {
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
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Dialog.Root, {
                open: discardConfirmationModalIsOpen,
                onOpenChange: setDiscardConfirmationModalIsOpen,
                children: /*#__PURE__*/ jsxRuntime.jsx(strapiAdmin.ConfirmDialog, {
                    onConfirm: discardChanges,
                    children: formatMessage({
                        id: getTrad.getTrad('popUpWarning.discardAll.message'),
                        defaultMessage: 'Are you sure you want to discard all changes?'
                    })
                })
            })
        ]
    });
};

exports.ContentTypeBuilderNav = ContentTypeBuilderNav;
//# sourceMappingURL=ContentTypeBuilderNav.js.map
