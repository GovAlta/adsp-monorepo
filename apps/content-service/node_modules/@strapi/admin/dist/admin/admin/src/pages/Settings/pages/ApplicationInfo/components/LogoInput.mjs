import { jsx, jsxs, Fragment } from 'react/jsx-runtime';
import * as React from 'react';
import { createContext } from '@radix-ui/react-context';
import { Field, Modal, CarouselInput, CarouselActions, IconButton, CarouselSlide, Box, Tabs, TextInput, Button, Flex, Typography, Card, CardHeader, CardAsset, CardBody, CardContent, CardTitle, CardSubtitle, CardBadge } from '@strapi/design-system';
import { Plus, ArrowClockwise, PlusCircle } from '@strapi/icons';
import axios, { AxiosError } from 'axios';
import { useIntl } from 'react-intl';
import { styled } from 'styled-components';
import { ACCEPTED_FORMAT, SIZE, DIMENSION } from '../utils/constants.mjs';
import { parseFileMetadatas, ParsingFileError } from '../utils/files.mjs';

const [LogoInputContextProvider, useLogoInputContext] = createContext('LogoInput');
const LogoInput = ({ canUpdate, customLogo, defaultLogo, hint, label, onChangeLogo })=>{
    const [localImage, setLocalImage] = React.useState();
    const [currentStep, setCurrentStep] = React.useState();
    const { formatMessage } = useIntl();
    const handleClose = ()=>{
        setLocalImage(undefined);
        setCurrentStep(undefined);
    };
    return /*#__PURE__*/ jsx(Modal.Root, {
        open: !!currentStep,
        onOpenChange: (state)=>{
            if (state === false) {
                handleClose();
            }
        },
        children: /*#__PURE__*/ jsxs(LogoInputContextProvider, {
            setLocalImage: setLocalImage,
            localImage: localImage,
            goToStep: setCurrentStep,
            onClose: handleClose,
            children: [
                /*#__PURE__*/ jsx(CarouselInput, {
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
                    actions: /*#__PURE__*/ jsxs(CarouselActions, {
                        children: [
                            /*#__PURE__*/ jsx(Modal.Trigger, {
                                children: /*#__PURE__*/ jsx(IconButton, {
                                    disabled: !canUpdate,
                                    onClick: ()=>setCurrentStep('upload'),
                                    label: formatMessage({
                                        id: 'Settings.application.customization.carousel.change-action',
                                        defaultMessage: 'Change logo'
                                    }),
                                    children: /*#__PURE__*/ jsx(Plus, {})
                                })
                            }),
                            customLogo?.url && /*#__PURE__*/ jsx(IconButton, {
                                disabled: !canUpdate,
                                onClick: ()=>onChangeLogo(null),
                                label: formatMessage({
                                    id: 'Settings.application.customization.carousel.reset-action',
                                    defaultMessage: 'Reset logo'
                                }),
                                children: /*#__PURE__*/ jsx(ArrowClockwise, {})
                            })
                        ]
                    }),
                    children: /*#__PURE__*/ jsx(CarouselSlide, {
                        label: formatMessage({
                            id: 'Settings.application.customization.carousel-slide.label',
                            defaultMessage: 'Logo slide'
                        }),
                        children: /*#__PURE__*/ jsx(Box, {
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
                /*#__PURE__*/ jsxs(Modal.Content, {
                    children: [
                        /*#__PURE__*/ jsx(Modal.Header, {
                            children: /*#__PURE__*/ jsx(Modal.Title, {
                                children: formatMessage(currentStep === 'upload' ? {
                                    id: 'Settings.application.customization.modal.upload',
                                    defaultMessage: 'Upload logo'
                                } : {
                                    id: 'Settings.application.customization.modal.pending',
                                    defaultMessage: 'Pending logo'
                                })
                            })
                        }),
                        currentStep === 'upload' ? /*#__PURE__*/ jsx(AddLogoDialog, {}) : /*#__PURE__*/ jsx(PendingLogoDialog, {
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
    const { formatMessage } = useIntl();
    return /*#__PURE__*/ jsxs(Tabs.Root, {
        variant: "simple",
        defaultValue: "computer",
        children: [
            /*#__PURE__*/ jsx(Box, {
                paddingLeft: 8,
                paddingRight: 8,
                children: /*#__PURE__*/ jsxs(Tabs.List, {
                    "aria-label": formatMessage({
                        id: 'Settings.application.customization.modal.tab.label',
                        defaultMessage: 'How do you want to upload your assets?'
                    }),
                    children: [
                        /*#__PURE__*/ jsx(Tabs.Trigger, {
                            value: "computer",
                            children: formatMessage({
                                id: 'Settings.application.customization.modal.upload.from-computer',
                                defaultMessage: 'From computer'
                            })
                        }),
                        /*#__PURE__*/ jsx(Tabs.Trigger, {
                            value: "url",
                            children: formatMessage({
                                id: 'Settings.application.customization.modal.upload.from-url',
                                defaultMessage: 'From url'
                            })
                        })
                    ]
                })
            }),
            /*#__PURE__*/ jsx(Tabs.Content, {
                value: "computer",
                children: /*#__PURE__*/ jsx(ComputerForm, {})
            }),
            /*#__PURE__*/ jsx(Tabs.Content, {
                value: "url",
                children: /*#__PURE__*/ jsx(URLForm, {})
            })
        ]
    });
};
/* -------------------------------------------------------------------------------------------------
 * URLForm
 * -----------------------------------------------------------------------------------------------*/ const URLForm = ()=>{
    const { formatMessage } = useIntl();
    const [logoUrl, setLogoUrl] = React.useState('');
    const [error, setError] = React.useState();
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
            const asset = await parseFileMetadatas(file);
            setLocalImage(asset);
            goToStep('pending');
        } catch (err) {
            if (err instanceof AxiosError) {
                setError(formatMessage({
                    id: 'Settings.application.customization.modal.upload.error-network',
                    defaultMessage: 'Network error'
                }));
            } else if (err instanceof ParsingFileError) {
                setError(formatMessage(err.displayMessage, {
                    size: SIZE,
                    dimension: DIMENSION
                }));
            } else {
                throw err;
            }
        }
    };
    return /*#__PURE__*/ jsxs("form", {
        onSubmit: handleSubmit,
        children: [
            /*#__PURE__*/ jsx(Box, {
                paddingLeft: 8,
                paddingRight: 8,
                paddingTop: 6,
                paddingBottom: 6,
                children: /*#__PURE__*/ jsxs(Field.Root, {
                    error: error,
                    name: "logo-url",
                    children: [
                        /*#__PURE__*/ jsx(Field.Label, {
                            children: formatMessage({
                                id: 'Settings.application.customization.modal.upload.from-url.input-label',
                                defaultMessage: 'URL'
                            })
                        }),
                        /*#__PURE__*/ jsx(TextInput, {
                            onChange: handleChange,
                            value: logoUrl
                        }),
                        /*#__PURE__*/ jsx(Field.Error, {})
                    ]
                })
            }),
            /*#__PURE__*/ jsxs(Modal.Footer, {
                children: [
                    /*#__PURE__*/ jsx(Button, {
                        onClick: onClose,
                        variant: "tertiary",
                        children: formatMessage({
                            id: 'app.components.Button.cancel',
                            defaultMessage: 'Cancel'
                        })
                    }),
                    /*#__PURE__*/ jsx(Button, {
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
    const { formatMessage } = useIntl();
    const [dragOver, setDragOver] = React.useState(false);
    const [fileError, setFileError] = React.useState();
    const inputRef = React.useRef(null);
    const id = React.useId();
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
            const asset = await parseFileMetadatas(file);
            setLocalImage(asset);
            goToStep('pending');
        } catch (err) {
            if (err instanceof ParsingFileError) {
                setFileError(formatMessage(err.displayMessage, {
                    size: SIZE,
                    dimension: DIMENSION
                }));
                inputRef.current.focus();
            } else {
                throw err;
            }
        }
    };
    return /*#__PURE__*/ jsxs(Fragment, {
        children: [
            /*#__PURE__*/ jsx("form", {
                children: /*#__PURE__*/ jsx(Box, {
                    paddingLeft: 8,
                    paddingRight: 8,
                    paddingTop: 6,
                    paddingBottom: 6,
                    children: /*#__PURE__*/ jsx(Field.Root, {
                        name: id,
                        error: fileError,
                        children: /*#__PURE__*/ jsxs(Flex, {
                            direction: "column",
                            alignItems: "stretch",
                            gap: 2,
                            children: [
                                /*#__PURE__*/ jsxs(Flex, {
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
                                        /*#__PURE__*/ jsx(PlusCircle, {
                                            fill: "primary600",
                                            width: "6rem",
                                            height: "6rem",
                                            "aria-hidden": true
                                        }),
                                        /*#__PURE__*/ jsx(Box, {
                                            paddingTop: 3,
                                            paddingBottom: 5,
                                            children: /*#__PURE__*/ jsx(Typography, {
                                                variant: "delta",
                                                tag: "label",
                                                htmlFor: id,
                                                children: formatMessage({
                                                    id: 'Settings.application.customization.modal.upload.drag-drop',
                                                    defaultMessage: 'Drag and Drop here or'
                                                })
                                            })
                                        }),
                                        /*#__PURE__*/ jsx(Box, {
                                            position: "relative",
                                            children: /*#__PURE__*/ jsx(FileInput, {
                                                accept: ACCEPTED_FORMAT.join(', '),
                                                type: "file",
                                                name: "files",
                                                tabIndex: -1,
                                                onChange: handleChange,
                                                ref: inputRef,
                                                id: id
                                            })
                                        }),
                                        /*#__PURE__*/ jsx(Button, {
                                            type: "button",
                                            onClick: handleClick,
                                            children: formatMessage({
                                                id: 'Settings.application.customization.modal.upload.cta.browse',
                                                defaultMessage: 'Browse files'
                                            })
                                        }),
                                        /*#__PURE__*/ jsx(Box, {
                                            paddingTop: 6,
                                            children: /*#__PURE__*/ jsx(Typography, {
                                                variant: "pi",
                                                textColor: "neutral600",
                                                children: formatMessage({
                                                    id: 'Settings.application.customization.modal.upload.file-validation',
                                                    defaultMessage: 'Max dimension: {dimension}x{dimension}, Max size: {size}KB'
                                                }, {
                                                    size: SIZE,
                                                    dimension: DIMENSION
                                                })
                                            })
                                        })
                                    ]
                                }),
                                /*#__PURE__*/ jsx(Field.Error, {})
                            ]
                        })
                    })
                })
            }),
            /*#__PURE__*/ jsx(Modal.Footer, {
                children: /*#__PURE__*/ jsx(Button, {
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
const FileInput = styled(Field.Input)`
  opacity: 0;
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1;
`;
const PendingLogoDialog = ({ onChangeLogo })=>{
    const { formatMessage } = useIntl();
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
    return /*#__PURE__*/ jsxs(Fragment, {
        children: [
            /*#__PURE__*/ jsx(Modal.Body, {
                children: /*#__PURE__*/ jsxs(Box, {
                    paddingLeft: 8,
                    paddingRight: 8,
                    paddingTop: 6,
                    paddingBottom: 6,
                    children: [
                        /*#__PURE__*/ jsxs(Flex, {
                            justifyContent: "space-between",
                            paddingBottom: 6,
                            children: [
                                /*#__PURE__*/ jsxs(Flex, {
                                    direction: "column",
                                    alignItems: "flex-start",
                                    children: [
                                        /*#__PURE__*/ jsx(Typography, {
                                            variant: "pi",
                                            fontWeight: "bold",
                                            children: formatMessage({
                                                id: 'Settings.application.customization.modal.pending.title',
                                                defaultMessage: 'Logo ready to upload'
                                            })
                                        }),
                                        /*#__PURE__*/ jsx(Typography, {
                                            variant: "pi",
                                            textColor: "neutral500",
                                            children: formatMessage({
                                                id: 'Settings.application.customization.modal.pending.subtitle',
                                                defaultMessage: 'Manage the chosen logo before uploading it'
                                            })
                                        })
                                    ]
                                }),
                                /*#__PURE__*/ jsx(Button, {
                                    onClick: handleGoBack,
                                    variant: "secondary",
                                    children: formatMessage({
                                        id: 'Settings.application.customization.modal.pending.choose-another',
                                        defaultMessage: 'Choose another logo'
                                    })
                                })
                            ]
                        }),
                        /*#__PURE__*/ jsx(Box, {
                            maxWidth: `18rem`,
                            children: localImage?.url ? /*#__PURE__*/ jsx(ImageCardAsset, {
                                asset: localImage
                            }) : null
                        })
                    ]
                })
            }),
            /*#__PURE__*/ jsxs(Modal.Footer, {
                children: [
                    /*#__PURE__*/ jsx(Modal.Close, {
                        children: /*#__PURE__*/ jsx(Button, {
                            onClick: onClose,
                            variant: "tertiary",
                            children: formatMessage({
                                id: 'Settings.application.customization.modal.cancel',
                                defaultMessage: 'Cancel'
                            })
                        })
                    }),
                    /*#__PURE__*/ jsx(Button, {
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
    const { formatMessage } = useIntl();
    return /*#__PURE__*/ jsxs(Card, {
        children: [
            /*#__PURE__*/ jsx(CardHeader, {
                children: /*#__PURE__*/ jsx(CardAsset, {
                    size: "S",
                    src: asset.url
                })
            }),
            /*#__PURE__*/ jsxs(CardBody, {
                children: [
                    /*#__PURE__*/ jsxs(CardContent, {
                        children: [
                            /*#__PURE__*/ jsx(CardTitle, {
                                children: asset.name
                            }),
                            /*#__PURE__*/ jsx(CardSubtitle, {
                                children: `${asset.ext?.toUpperCase()} - ${asset.width}✕${asset.height}`
                            })
                        ]
                    }),
                    /*#__PURE__*/ jsx(CardBadge, {
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

export { LogoInput };
//# sourceMappingURL=LogoInput.mjs.map
