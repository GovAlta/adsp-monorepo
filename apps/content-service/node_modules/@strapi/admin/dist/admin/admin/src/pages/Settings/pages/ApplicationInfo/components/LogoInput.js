'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var reactContext = require('@radix-ui/react-context');
var designSystem = require('@strapi/design-system');
var icons = require('@strapi/icons');
var axios = require('axios');
var reactIntl = require('react-intl');
var styled = require('styled-components');
var constants = require('../utils/constants.js');
var files = require('../utils/files.js');

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

const [LogoInputContextProvider, useLogoInputContext] = reactContext.createContext('LogoInput');
const LogoInput = ({ canUpdate, customLogo, defaultLogo, hint, label, onChangeLogo })=>{
    const [localImage, setLocalImage] = React__namespace.useState();
    const [currentStep, setCurrentStep] = React__namespace.useState();
    const { formatMessage } = reactIntl.useIntl();
    const handleClose = ()=>{
        setLocalImage(undefined);
        setCurrentStep(undefined);
    };
    return /*#__PURE__*/ jsxRuntime.jsx(designSystem.Modal.Root, {
        open: !!currentStep,
        onOpenChange: (state)=>{
            if (state === false) {
                handleClose();
            }
        },
        children: /*#__PURE__*/ jsxRuntime.jsxs(LogoInputContextProvider, {
            setLocalImage: setLocalImage,
            localImage: localImage,
            goToStep: setCurrentStep,
            onClose: handleClose,
            children: [
                /*#__PURE__*/ jsxRuntime.jsx(designSystem.CarouselInput, {
                    label: label,
                    selectedSlide: 0,
                    hint: hint,
                    // Carousel is used here for a single media,
                    // we don't need previous and next labels but these props are required
                    previousLabel: "",
                    nextLabel: "",
                    onNext: ()=>{},
                    onPrevious: ()=>{},
                    secondaryLabel: customLogo?.name || 'logo.png',
                    actions: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.CarouselActions, {
                        children: [
                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Modal.Trigger, {
                                children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.IconButton, {
                                    disabled: !canUpdate,
                                    onClick: ()=>setCurrentStep('upload'),
                                    label: formatMessage({
                                        id: 'Settings.application.customization.carousel.change-action',
                                        defaultMessage: 'Change logo'
                                    }),
                                    children: /*#__PURE__*/ jsxRuntime.jsx(icons.Plus, {})
                                })
                            }),
                            customLogo?.url && /*#__PURE__*/ jsxRuntime.jsx(designSystem.IconButton, {
                                disabled: !canUpdate,
                                onClick: ()=>onChangeLogo(null),
                                label: formatMessage({
                                    id: 'Settings.application.customization.carousel.reset-action',
                                    defaultMessage: 'Reset logo'
                                }),
                                children: /*#__PURE__*/ jsxRuntime.jsx(icons.ArrowClockwise, {})
                            })
                        ]
                    }),
                    children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.CarouselSlide, {
                        label: formatMessage({
                            id: 'Settings.application.customization.carousel-slide.label',
                            defaultMessage: 'Logo slide'
                        }),
                        children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                            maxHeight: "40%",
                            maxWidth: "40%",
                            tag: "img",
                            src: customLogo?.url || defaultLogo,
                            alt: formatMessage({
                                id: 'Settings.application.customization.carousel.title',
                                defaultMessage: 'Logo'
                            })
                        })
                    })
                }),
                /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Modal.Content, {
                    children: [
                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Modal.Header, {
                            children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Modal.Title, {
                                children: formatMessage(currentStep === 'upload' ? {
                                    id: 'Settings.application.customization.modal.upload',
                                    defaultMessage: 'Upload logo'
                                } : {
                                    id: 'Settings.application.customization.modal.pending',
                                    defaultMessage: 'Pending logo'
                                })
                            })
                        }),
                        currentStep === 'upload' ? /*#__PURE__*/ jsxRuntime.jsx(AddLogoDialog, {}) : /*#__PURE__*/ jsxRuntime.jsx(PendingLogoDialog, {
                            onChangeLogo: onChangeLogo
                        })
                    ]
                })
            ]
        })
    });
};
/* -------------------------------------------------------------------------------------------------
 * AddLogoDialog
 * -----------------------------------------------------------------------------------------------*/ const AddLogoDialog = ()=>{
    const { formatMessage } = reactIntl.useIntl();
    return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Tabs.Root, {
        variant: "simple",
        defaultValue: "computer",
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                paddingLeft: 8,
                paddingRight: 8,
                children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Tabs.List, {
                    "aria-label": formatMessage({
                        id: 'Settings.application.customization.modal.tab.label',
                        defaultMessage: 'How do you want to upload your assets?'
                    }),
                    children: [
                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Tabs.Trigger, {
                            value: "computer",
                            children: formatMessage({
                                id: 'Settings.application.customization.modal.upload.from-computer',
                                defaultMessage: 'From computer'
                            })
                        }),
                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Tabs.Trigger, {
                            value: "url",
                            children: formatMessage({
                                id: 'Settings.application.customization.modal.upload.from-url',
                                defaultMessage: 'From url'
                            })
                        })
                    ]
                })
            }),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Tabs.Content, {
                value: "computer",
                children: /*#__PURE__*/ jsxRuntime.jsx(ComputerForm, {})
            }),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Tabs.Content, {
                value: "url",
                children: /*#__PURE__*/ jsxRuntime.jsx(URLForm, {})
            })
        ]
    });
};
/* -------------------------------------------------------------------------------------------------
 * URLForm
 * -----------------------------------------------------------------------------------------------*/ const URLForm = ()=>{
    const { formatMessage } = reactIntl.useIntl();
    const [logoUrl, setLogoUrl] = React__namespace.useState('');
    const [error, setError] = React__namespace.useState();
    const { setLocalImage, goToStep, onClose } = useLogoInputContext('URLForm');
    const handleChange = (e)=>{
        setLogoUrl(e.target.value);
    };
    const handleSubmit = async (event)=>{
        event.preventDefault();
        const data = new FormData(event.target);
        const url = data.get('logo-url');
        if (!url) {
            return;
        }
        try {
            const res = await axios.get(url.toString(), {
                responseType: 'blob',
                timeout: 8000
            });
            const file = new File([
                res.data
            ], res.config.url ?? '', {
                type: res.headers['content-type']
            });
            const asset = await files.parseFileMetadatas(file);
            setLocalImage(asset);
            goToStep('pending');
        } catch (err) {
            if (err instanceof axios.AxiosError) {
                setError(formatMessage({
                    id: 'Settings.application.customization.modal.upload.error-network',
                    defaultMessage: 'Network error'
                }));
            } else if (err instanceof files.ParsingFileError) {
                setError(formatMessage(err.displayMessage, {
                    size: constants.SIZE,
                    dimension: constants.DIMENSION
                }));
            } else {
                throw err;
            }
        }
    };
    return /*#__PURE__*/ jsxRuntime.jsxs("form", {
        onSubmit: handleSubmit,
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                paddingLeft: 8,
                paddingRight: 8,
                paddingTop: 6,
                paddingBottom: 6,
                children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Field.Root, {
                    error: error,
                    name: "logo-url",
                    children: [
                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Label, {
                            children: formatMessage({
                                id: 'Settings.application.customization.modal.upload.from-url.input-label',
                                defaultMessage: 'URL'
                            })
                        }),
                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.TextInput, {
                            onChange: handleChange,
                            value: logoUrl
                        }),
                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Error, {})
                    ]
                })
            }),
            /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Modal.Footer, {
                children: [
                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Button, {
                        onClick: onClose,
                        variant: "tertiary",
                        children: formatMessage({
                            id: 'app.components.Button.cancel',
                            defaultMessage: 'Cancel'
                        })
                    }),
                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Button, {
                        type: "submit",
                        children: formatMessage({
                            id: 'Settings.application.customization.modal.upload.next',
                            defaultMessage: 'Next'
                        })
                    })
                ]
            })
        ]
    });
};
/* -------------------------------------------------------------------------------------------------
 * ComputerForm
 * -----------------------------------------------------------------------------------------------*/ const ComputerForm = ()=>{
    const { formatMessage } = reactIntl.useIntl();
    const [dragOver, setDragOver] = React__namespace.useState(false);
    const [fileError, setFileError] = React__namespace.useState();
    const inputRef = React__namespace.useRef(null);
    const id = React__namespace.useId();
    const { setLocalImage, goToStep, onClose } = useLogoInputContext('ComputerForm');
    const handleDragEnter = ()=>{
        setDragOver(true);
    };
    const handleDragLeave = ()=>{
        setDragOver(false);
    };
    const handleClick = (e)=>{
        e.preventDefault();
        inputRef.current.click();
    };
    const handleChange = async ()=>{
        handleDragLeave();
        if (!inputRef.current.files) {
            return;
        }
        const [file] = inputRef.current.files;
        try {
            const asset = await files.parseFileMetadatas(file);
            setLocalImage(asset);
            goToStep('pending');
        } catch (err) {
            if (err instanceof files.ParsingFileError) {
                setFileError(formatMessage(err.displayMessage, {
                    size: constants.SIZE,
                    dimension: constants.DIMENSION
                }));
                inputRef.current.focus();
            } else {
                throw err;
            }
        }
    };
    return /*#__PURE__*/ jsxRuntime.jsxs(jsxRuntime.Fragment, {
        children: [
            /*#__PURE__*/ jsxRuntime.jsx("form", {
                children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                    paddingLeft: 8,
                    paddingRight: 8,
                    paddingTop: 6,
                    paddingBottom: 6,
                    children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Root, {
                        name: id,
                        error: fileError,
                        children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                            direction: "column",
                            alignItems: "stretch",
                            gap: 2,
                            children: [
                                /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                                    paddingTop: 9,
                                    paddingBottom: 7,
                                    hasRadius: true,
                                    justifyContent: "center",
                                    direction: "column",
                                    background: dragOver ? 'primary100' : 'neutral100',
                                    borderColor: dragOver ? 'primary500' : fileError ? 'danger600' : 'neutral300',
                                    borderStyle: "dashed",
                                    borderWidth: "1px",
                                    position: "relative",
                                    onDragEnter: handleDragEnter,
                                    onDragLeave: handleDragLeave,
                                    children: [
                                        /*#__PURE__*/ jsxRuntime.jsx(icons.PlusCircle, {
                                            fill: "primary600",
                                            width: "6rem",
                                            height: "6rem",
                                            "aria-hidden": true
                                        }),
                                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                                            paddingTop: 3,
                                            paddingBottom: 5,
                                            children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                                variant: "delta",
                                                tag: "label",
                                                htmlFor: id,
                                                children: formatMessage({
                                                    id: 'Settings.application.customization.modal.upload.drag-drop',
                                                    defaultMessage: 'Drag and Drop here or'
                                                })
                                            })
                                        }),
                                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                                            position: "relative",
                                            children: /*#__PURE__*/ jsxRuntime.jsx(FileInput, {
                                                accept: constants.ACCEPTED_FORMAT.join(', '),
                                                type: "file",
                                                name: "files",
                                                tabIndex: -1,
                                                onChange: handleChange,
                                                ref: inputRef,
                                                id: id
                                            })
                                        }),
                                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Button, {
                                            type: "button",
                                            onClick: handleClick,
                                            children: formatMessage({
                                                id: 'Settings.application.customization.modal.upload.cta.browse',
                                                defaultMessage: 'Browse files'
                                            })
                                        }),
                                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                                            paddingTop: 6,
                                            children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                                variant: "pi",
                                                textColor: "neutral600",
                                                children: formatMessage({
                                                    id: 'Settings.application.customization.modal.upload.file-validation',
                                                    defaultMessage: 'Max dimension: {dimension}x{dimension}, Max size: {size}KB'
                                                }, {
                                                    size: constants.SIZE,
                                                    dimension: constants.DIMENSION
                                                })
                                            })
                                        })
                                    ]
                                }),
                                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Field.Error, {})
                            ]
                        })
                    })
                })
            }),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Modal.Footer, {
                children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Button, {
                    onClick: onClose,
                    variant: "tertiary",
                    children: formatMessage({
                        id: 'app.components.Button.cancel',
                        defaultMessage: 'Cancel'
                    })
                })
            })
        ]
    });
};
const FileInput = styled.styled(designSystem.Field.Input)`
  opacity: 0;
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1;
`;
const PendingLogoDialog = ({ onChangeLogo })=>{
    const { formatMessage } = reactIntl.useIntl();
    const { localImage, setLocalImage, goToStep, onClose } = useLogoInputContext('PendingLogoDialog');
    const handleGoBack = ()=>{
        setLocalImage(undefined);
        goToStep('upload');
    };
    const handleUpload = ()=>{
        if (localImage) {
            onChangeLogo(localImage);
        }
        onClose();
    };
    return /*#__PURE__*/ jsxRuntime.jsxs(jsxRuntime.Fragment, {
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Modal.Body, {
                children: /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Box, {
                    paddingLeft: 8,
                    paddingRight: 8,
                    paddingTop: 6,
                    paddingBottom: 6,
                    children: [
                        /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                            justifyContent: "space-between",
                            paddingBottom: 6,
                            children: [
                                /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                                    direction: "column",
                                    alignItems: "flex-start",
                                    children: [
                                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                            variant: "pi",
                                            fontWeight: "bold",
                                            children: formatMessage({
                                                id: 'Settings.application.customization.modal.pending.title',
                                                defaultMessage: 'Logo ready to upload'
                                            })
                                        }),
                                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                            variant: "pi",
                                            textColor: "neutral500",
                                            children: formatMessage({
                                                id: 'Settings.application.customization.modal.pending.subtitle',
                                                defaultMessage: 'Manage the chosen logo before uploading it'
                                            })
                                        })
                                    ]
                                }),
                                /*#__PURE__*/ jsxRuntime.jsx(designSystem.Button, {
                                    onClick: handleGoBack,
                                    variant: "secondary",
                                    children: formatMessage({
                                        id: 'Settings.application.customization.modal.pending.choose-another',
                                        defaultMessage: 'Choose another logo'
                                    })
                                })
                            ]
                        }),
                        /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                            maxWidth: `18rem`,
                            children: localImage?.url ? /*#__PURE__*/ jsxRuntime.jsx(ImageCardAsset, {
                                asset: localImage
                            }) : null
                        })
                    ]
                })
            }),
            /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Modal.Footer, {
                children: [
                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Modal.Close, {
                        children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.Button, {
                            onClick: onClose,
                            variant: "tertiary",
                            children: formatMessage({
                                id: 'Settings.application.customization.modal.cancel',
                                defaultMessage: 'Cancel'
                            })
                        })
                    }),
                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Button, {
                        onClick: handleUpload,
                        children: formatMessage({
                            id: 'Settings.application.customization.modal.pending.upload',
                            defaultMessage: 'Upload logo'
                        })
                    })
                ]
            })
        ]
    });
};
const ImageCardAsset = ({ asset })=>{
    const { formatMessage } = reactIntl.useIntl();
    return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Card, {
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.CardHeader, {
                children: /*#__PURE__*/ jsxRuntime.jsx(designSystem.CardAsset, {
                    size: "S",
                    src: asset.url
                })
            }),
            /*#__PURE__*/ jsxRuntime.jsxs(designSystem.CardBody, {
                children: [
                    /*#__PURE__*/ jsxRuntime.jsxs(designSystem.CardContent, {
                        children: [
                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.CardTitle, {
                                children: asset.name
                            }),
                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.CardSubtitle, {
                                children: `${asset.ext?.toUpperCase()} - ${asset.width}✕${asset.height}`
                            })
                        ]
                    }),
                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.CardBadge, {
                        children: formatMessage({
                            id: 'Settings.application.customization.modal.pending.card-badge',
                            defaultMessage: 'image'
                        })
                    })
                ]
            })
        ]
    });
};

exports.LogoInput = LogoInput;
//# sourceMappingURL=LogoInput.js.map
