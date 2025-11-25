'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var designSystem = require('@strapi/design-system');
var Icons = require('@strapi/icons');
var AttachmentPreview = require('./components/Attachments/AttachmentPreview.js');
var StepModal = require('./components/StepModal.js');
var useAttachments = require('./hooks/useAttachments.js');
var useCodeUpload = require('./hooks/useCodeUpload.js');
var useTranslations = require('./hooks/useTranslations.js');
var constants = require('./lib/constants.js');
var misc = require('./lib/misc.js');
var ChatProvider = require('./providers/ChatProvider.js');

const UploadProjectContext = /*#__PURE__*/ React.createContext({
    isCodeUploadOpen: false,
    submitOnFinish: false,
    openCodeUpload: ()=>{},
    closeCodeUpload: ()=>{}
});
const useUploadProjectToChat = ()=>React.useContext(UploadProjectContext);
const UploadProjectToChatProvider = ({ children })=>{
    const [isCodeUploadOpen, setIsCodeUploadOpen] = React.useState(false);
    const [submitOnFinish, setSubmitOnFinish] = React.useState(false);
    const openCodeUpload = (submitOnFinish)=>{
        setIsCodeUploadOpen(true);
        setSubmitOnFinish(submitOnFinish ?? false);
    };
    const closeCodeUpload = ()=>setIsCodeUploadOpen(false);
    return /*#__PURE__*/ jsxRuntime.jsxs(UploadProjectContext.Provider, {
        value: {
            isCodeUploadOpen,
            submitOnFinish,
            openCodeUpload,
            closeCodeUpload
        },
        children: [
            isCodeUploadOpen && /*#__PURE__*/ jsxRuntime.jsx(UploadCodeModal, {}),
            children
        ]
    });
};
const DropZone = ({ importType, onAddFiles, error })=>{
    const [dragOver, setDragOver] = React.useState(false);
    const inputRef = React.useRef(null);
    const { t } = useTranslations.useTranslations();
    const handleDragOver = (event)=>{
        event.preventDefault();
    };
    const handleDragEnter = (event)=>{
        event.preventDefault();
        setDragOver(true);
    };
    const handleDragLeave = ()=>setDragOver(false);
    const handleClick = (e)=>{
        e.preventDefault();
        inputRef.current?.click();
    };
    const handleChange = ()=>{
        const files = inputRef.current?.files;
        if (files) {
            onAddFiles(Array.from(files));
        }
    };
    /**
   * Recursively reads a directory and its contents
   */ const readDirectory = async (entry)=>{
        const reader = entry.createReader();
        const getEntries = ()=>{
            return new Promise((resolve, reject)=>{
                reader.readEntries(resolve, reject);
            });
        };
        const files = [];
        let entries = [];
        // Read entries in batches until no more entries are left
        do {
            entries = await getEntries();
            for (const entry of entries){
                if (entry.isFile) {
                    const fileEntry = entry;
                    const file = await new Promise((resolve, reject)=>{
                        fileEntry.file(resolve, reject);
                    });
                    // Store the full path including the directory structure
                    Object.defineProperty(file, 'webkitRelativePath', {
                        writable: true,
                        value: entry.fullPath.substring(1)
                    });
                    files.push(file);
                } else if (entry.isDirectory) {
                    // Recursively process subdirectories
                    const dirEntry = entry;
                    const subFiles = await readDirectory(dirEntry);
                    files.push(...subFiles);
                }
            }
        }while (entries.length > 0)
        return files;
    };
    const handleDrop = async (e)=>{
        e.preventDefault();
        setDragOver(false);
        if (!e.dataTransfer?.items) {
            return;
        }
        // For folder upload, process directories recursively
        if (importType === 'folder') {
            const items = e.dataTransfer.items;
            const allFiles = [];
            for(let i = 0; i < items.length; i++){
                const item = items[i];
                // Use webkitGetAsEntry to access the file system entry
                const entry = item.webkitGetAsEntry?.();
                if (entry) {
                    if (entry.isDirectory) {
                        const files = await readDirectory(entry);
                        allFiles.push(...files);
                    } else if (entry.isFile) {
                        const file = await new Promise((resolve, reject)=>{
                            entry.file(resolve, reject);
                        });
                        allFiles.push(file);
                    }
                }
            }
            if (allFiles.length > 0) {
                onAddFiles(allFiles);
            }
        } else {
            // For zip files, just import them regularly
            if (e.dataTransfer.files) {
                onAddFiles(Array.from(e.dataTransfer.files));
            }
        }
    };
    return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
        position: "relative",
        cursor: "pointer",
        width: "100%",
        height: "100%",
        minHeight: "140px",
        borderStyle: "dashed",
        borderColor: dragOver ? 'primary500' : error ? 'danger600' : 'neutral200',
        background: dragOver ? 'primary100' : error ? 'danger100' : 'neutral100',
        hasRadius: true,
        padding: 7,
        justifyContent: "center",
        direction: "column",
        alignItems: "center",
        gap: 2,
        onDragEnter: handleDragEnter,
        onDragLeave: handleDragLeave,
        onDragOver: handleDragOver,
        onDrop: handleDrop,
        children: [
            importType === 'zip' ? /*#__PURE__*/ jsxRuntime.jsx(Icons.FileZip, {
                width: '24px',
                height: '24px'
            }) : /*#__PURE__*/ jsxRuntime.jsx(Icons.Folder, {
                width: '24px',
                height: '24px'
            }),
            /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                direction: "column",
                alignItems: "center",
                gap: 2,
                children: [
                    /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Typography, {
                        variant: "omega",
                        textColor: "neutral600",
                        textAlign: "center",
                        children: [
                            importType === 'zip' ? t('chat.code-upload.drop-zone', 'Drop here a .zip file here or') : t('chat.code-upload.drop-zone-folder', 'Drop here a folder here or'),
                            ' ',
                            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                                variant: "omega",
                                textColor: "primary600",
                                onClick: handleClick,
                                children: t('chat.code-upload.drop-zone-browse', 'browse files')
                            })
                        ]
                    }),
                    error && /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                        variant: "pi",
                        textColor: "danger600",
                        children: error
                    })
                ]
            }),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                tag: "input",
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 0,
                top: 0,
                width: "100%",
                name: "code",
                "aria-label": "Upload project",
                tabIndex: -1,
                zIndex: 1,
                ref: inputRef,
                onChange: handleChange,
                style: {
                    opacity: 0,
                    cursor: 'pointer'
                },
                type: "file",
                ...importType === 'zip' ? {
                    accept: '.zip',
                    multiple: false
                } : {
                    multiple: true,
                    webkitdirectory: '',
                    directory: ''
                }
            })
        ]
    });
};
const CodeUploadStep = ({ setFileName, error, processZipFile, processFolder })=>{
    const { t } = useTranslations.useTranslations();
    const { nextStep } = StepModal.useStepModal();
    return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
        direction: "column",
        gap: 6,
        alignItems: "start",
        width: "100%",
        children: [
            /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                direction: "column",
                gap: 2,
                alignItems: "start",
                children: [
                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                        variant: "beta",
                        children: t('chat.code-upload.title', 'Import code')
                    }),
                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                        variant: "omega",
                        textColor: "neutral600",
                        children: t('chat.code-upload.description', 'Your app will be analyzed by AI. Make sure to remove all sensitive data before importation.')
                    })
                ]
            }),
            /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                gap: 3,
                width: "100%",
                wrap: "wrap",
                children: [
                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                        flex: 1,
                        minWidth: "200px",
                        children: /*#__PURE__*/ jsxRuntime.jsx(DropZone, {
                            importType: "zip",
                            onAddFiles: (files)=>{
                                if (files.length > 0) {
                                    const file = files[0];
                                    setFileName(file.name.replace('.zip', ''));
                                    nextStep();
                                    processZipFile(file);
                                }
                            },
                            error: error
                        })
                    }),
                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                        flex: 1,
                        minWidth: "200px",
                        children: /*#__PURE__*/ jsxRuntime.jsx(DropZone, {
                            importType: "folder",
                            onAddFiles: async (files)=>{
                                if (files.length > 0) {
                                    try {
                                        // Get the folder name from the first file's path
                                        const firstFile = files[0];
                                        const folderPath = firstFile.webkitRelativePath || '';
                                        const folderName = folderPath.split('/')[0] || 'Project';
                                        setFileName(folderName);
                                        nextStep();
                                        // Process the folder files
                                        await processFolder(files);
                                    } catch (err) {
                                        console.error('Error processing folder:', err);
                                    }
                                }
                            },
                            error: error
                        })
                    })
                ]
            })
        ]
    });
};
const CodeConfirmationStep = ({ projectName, isLoading, error })=>{
    const { t } = useTranslations.useTranslations();
    return /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
        direction: "column",
        gap: 6,
        alignItems: "start",
        width: "100%",
        children: [
            /*#__PURE__*/ jsxRuntime.jsxs(designSystem.Flex, {
                direction: "column",
                gap: 2,
                alignItems: "start",
                children: [
                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                        variant: "beta",
                        children: t('chat.code-upload.confirmation-title', 'Confirm Code Import')
                    }),
                    /*#__PURE__*/ jsxRuntime.jsx(designSystem.Typography, {
                        variant: "omega",
                        textColor: "neutral600",
                        children: t('chat.code-upload.confirmation-description', 'Your code is ready to be imported. Click finish to add it to your chat.')
                    })
                ]
            }),
            /*#__PURE__*/ jsxRuntime.jsx(designSystem.Box, {
                width: "100%",
                children: /*#__PURE__*/ jsxRuntime.jsx(AttachmentPreview.AttachmentPreview, {
                    attachment: {
                        id: misc.generateId(),
                        status: isLoading ? 'loading' : 'ready',
                        filename: projectName || '',
                        url: '',
                        type: 'file',
                        mediaType: constants.STRAPI_CODE_MIME_TYPE
                    },
                    error: error,
                    minWidth: "256px"
                })
            })
        ]
    });
};
/* -------------------------------------------------------------------------------------------------
 * Modal
 * -----------------------------------------------------------------------------------------------*/ const UploadCodeModal = ()=>{
    const [projectName, setProjectName] = React.useState(null);
    const [projectAttachment, setProjectAttachment] = React.useState(null);
    const { t } = useTranslations.useTranslations();
    // Attach files to the chat
    const { addAttachments } = useAttachments.useAttachments();
    const { processZipFile, processFolder, isLoading, error } = useCodeUpload.useCodeUpload({
        onSuccess: (file)=>setProjectAttachment(file)
    });
    const { isCodeUploadOpen, closeCodeUpload, submitOnFinish } = useUploadProjectToChat();
    const { sendMessage, openChat, input, setInput } = ChatProvider.useStrapiChat();
    const handleCancel = ()=>{
        setProjectName(null);
        setProjectAttachment(null);
        closeCodeUpload();
    };
    const handleComplete = async ()=>{
        // Ensure chat is opened
        openChat();
        if (projectAttachment && submitOnFinish) {
            sendMessage({
                role: 'user',
                parts: [
                    {
                        type: 'text',
                        text: 'Create schemas from my uploaded project'
                    },
                    projectAttachment
                ]
            });
        } else if (projectAttachment) {
            // If input is empty, set a predefined message
            if (!input) {
                setInput('Create schemas from my uploaded project');
            }
            // Attach files to the chat input
            addAttachments([
                projectAttachment
            ]);
        }
        closeCodeUpload();
    };
    const validateUploadStep = ()=>{
        return !!projectAttachment;
    };
    return /*#__PURE__*/ jsxRuntime.jsxs(StepModal.StepModal, {
        open: isCodeUploadOpen,
        onOpenChange: (isOpen)=>{
            if (!isOpen) handleCancel();
        },
        title: t('chat.code-upload.header', 'Import code'),
        onCancel: handleCancel,
        onComplete: handleComplete,
        children: [
            /*#__PURE__*/ jsxRuntime.jsx(StepModal.StepModal.Step, {
                title: t('chat.code-upload.step1-title', 'Import code'),
                nextLabel: t('chat.code-upload.continue-button', 'Continue'),
                cancelLabel: t('common.cancel', 'Cancel'),
                disableNext: !projectAttachment || isLoading,
                onNext: validateUploadStep,
                children: /*#__PURE__*/ jsxRuntime.jsx(CodeUploadStep, {
                    setFileName: setProjectName,
                    error: error,
                    processZipFile: processZipFile,
                    processFolder: processFolder
                })
            }),
            /*#__PURE__*/ jsxRuntime.jsx(StepModal.StepModal.Step, {
                title: t('chat.code-upload.step2-title', 'Confirm'),
                nextLabel: t('common.finish', 'Finish'),
                backLabel: t('form.button.back', 'Back'),
                disableNext: !projectAttachment || isLoading,
                children: /*#__PURE__*/ jsxRuntime.jsx(CodeConfirmationStep, {
                    projectName: projectName,
                    isLoading: isLoading,
                    error: error
                })
            })
        ]
    });
};

exports.UploadCodeModal = UploadCodeModal;
exports.UploadProjectToChatProvider = UploadProjectToChatProvider;
exports.useUploadProjectToChat = useUploadProjectToChat;
//# sourceMappingURL=UploadCodeModal.js.map
