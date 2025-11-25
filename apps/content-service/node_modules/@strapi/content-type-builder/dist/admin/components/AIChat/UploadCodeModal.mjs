import { jsxs, jsx } from 'react/jsx-runtime';
import { useContext, useState, createContext, useRef } from 'react';
import { Flex, Typography, Box } from '@strapi/design-system';
import { FileZip, Folder } from '@strapi/icons';
import { AttachmentPreview } from './components/Attachments/AttachmentPreview.mjs';
import { StepModal, useStepModal } from './components/StepModal.mjs';
import { useAttachments } from './hooks/useAttachments.mjs';
import { useCodeUpload } from './hooks/useCodeUpload.mjs';
import { useTranslations } from './hooks/useTranslations.mjs';
import { STRAPI_CODE_MIME_TYPE } from './lib/constants.mjs';
import { generateId } from './lib/misc.mjs';
import { useStrapiChat } from './providers/ChatProvider.mjs';

const UploadProjectContext = /*#__PURE__*/ createContext({
    isCodeUploadOpen: false,
    submitOnFinish: false,
    openCodeUpload: ()=>{},
    closeCodeUpload: ()=>{}
});
const useUploadProjectToChat = ()=>useContext(UploadProjectContext);
const UploadProjectToChatProvider = ({ children })=>{
    const [isCodeUploadOpen, setIsCodeUploadOpen] = useState(false);
    const [submitOnFinish, setSubmitOnFinish] = useState(false);
    const openCodeUpload = (submitOnFinish)=>{
        setIsCodeUploadOpen(true);
        setSubmitOnFinish(submitOnFinish ?? false);
    };
    const closeCodeUpload = ()=>setIsCodeUploadOpen(false);
    return /*#__PURE__*/ jsxs(UploadProjectContext.Provider, {
        value: {
            isCodeUploadOpen,
            submitOnFinish,
            openCodeUpload,
            closeCodeUpload
        },
        children: [
            isCodeUploadOpen && /*#__PURE__*/ jsx(UploadCodeModal, {}),
            children
        ]
    });
};
const DropZone = ({ importType, onAddFiles, error })=>{
    const [dragOver, setDragOver] = useState(false);
    const inputRef = useRef(null);
    const { t } = useTranslations();
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
    return /*#__PURE__*/ jsxs(Flex, {
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
            importType === 'zip' ? /*#__PURE__*/ jsx(FileZip, {
                width: '24px',
                height: '24px'
            }) : /*#__PURE__*/ jsx(Folder, {
                width: '24px',
                height: '24px'
            }),
            /*#__PURE__*/ jsxs(Flex, {
                direction: "column",
                alignItems: "center",
                gap: 2,
                children: [
                    /*#__PURE__*/ jsxs(Typography, {
                        variant: "omega",
                        textColor: "neutral600",
                        textAlign: "center",
                        children: [
                            importType === 'zip' ? t('chat.code-upload.drop-zone', 'Drop here a .zip file here or') : t('chat.code-upload.drop-zone-folder', 'Drop here a folder here or'),
                            ' ',
                            /*#__PURE__*/ jsx(Typography, {
                                variant: "omega",
                                textColor: "primary600",
                                onClick: handleClick,
                                children: t('chat.code-upload.drop-zone-browse', 'browse files')
                            })
                        ]
                    }),
                    error && /*#__PURE__*/ jsx(Typography, {
                        variant: "pi",
                        textColor: "danger600",
                        children: error
                    })
                ]
            }),
            /*#__PURE__*/ jsx(Box, {
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
    const { t } = useTranslations();
    const { nextStep } = useStepModal();
    return /*#__PURE__*/ jsxs(Flex, {
        direction: "column",
        gap: 6,
        alignItems: "start",
        width: "100%",
        children: [
            /*#__PURE__*/ jsxs(Flex, {
                direction: "column",
                gap: 2,
                alignItems: "start",
                children: [
                    /*#__PURE__*/ jsx(Typography, {
                        variant: "beta",
                        children: t('chat.code-upload.title', 'Import code')
                    }),
                    /*#__PURE__*/ jsx(Typography, {
                        variant: "omega",
                        textColor: "neutral600",
                        children: t('chat.code-upload.description', 'Your app will be analyzed by AI. Make sure to remove all sensitive data before importation.')
                    })
                ]
            }),
            /*#__PURE__*/ jsxs(Flex, {
                gap: 3,
                width: "100%",
                wrap: "wrap",
                children: [
                    /*#__PURE__*/ jsx(Box, {
                        flex: 1,
                        minWidth: "200px",
                        children: /*#__PURE__*/ jsx(DropZone, {
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
                    /*#__PURE__*/ jsx(Box, {
                        flex: 1,
                        minWidth: "200px",
                        children: /*#__PURE__*/ jsx(DropZone, {
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
    const { t } = useTranslations();
    return /*#__PURE__*/ jsxs(Flex, {
        direction: "column",
        gap: 6,
        alignItems: "start",
        width: "100%",
        children: [
            /*#__PURE__*/ jsxs(Flex, {
                direction: "column",
                gap: 2,
                alignItems: "start",
                children: [
                    /*#__PURE__*/ jsx(Typography, {
                        variant: "beta",
                        children: t('chat.code-upload.confirmation-title', 'Confirm Code Import')
                    }),
                    /*#__PURE__*/ jsx(Typography, {
                        variant: "omega",
                        textColor: "neutral600",
                        children: t('chat.code-upload.confirmation-description', 'Your code is ready to be imported. Click finish to add it to your chat.')
                    })
                ]
            }),
            /*#__PURE__*/ jsx(Box, {
                width: "100%",
                children: /*#__PURE__*/ jsx(AttachmentPreview, {
                    attachment: {
                        id: generateId(),
                        status: isLoading ? 'loading' : 'ready',
                        filename: projectName || '',
                        url: '',
                        type: 'file',
                        mediaType: STRAPI_CODE_MIME_TYPE
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
    const [projectName, setProjectName] = useState(null);
    const [projectAttachment, setProjectAttachment] = useState(null);
    const { t } = useTranslations();
    // Attach files to the chat
    const { addAttachments } = useAttachments();
    const { processZipFile, processFolder, isLoading, error } = useCodeUpload({
        onSuccess: (file)=>setProjectAttachment(file)
    });
    const { isCodeUploadOpen, closeCodeUpload, submitOnFinish } = useUploadProjectToChat();
    const { sendMessage, openChat, input, setInput } = useStrapiChat();
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
    return /*#__PURE__*/ jsxs(StepModal, {
        open: isCodeUploadOpen,
        onOpenChange: (isOpen)=>{
            if (!isOpen) handleCancel();
        },
        title: t('chat.code-upload.header', 'Import code'),
        onCancel: handleCancel,
        onComplete: handleComplete,
        children: [
            /*#__PURE__*/ jsx(StepModal.Step, {
                title: t('chat.code-upload.step1-title', 'Import code'),
                nextLabel: t('chat.code-upload.continue-button', 'Continue'),
                cancelLabel: t('common.cancel', 'Cancel'),
                disableNext: !projectAttachment || isLoading,
                onNext: validateUploadStep,
                children: /*#__PURE__*/ jsx(CodeUploadStep, {
                    setFileName: setProjectName,
                    error: error,
                    processZipFile: processZipFile,
                    processFolder: processFolder
                })
            }),
            /*#__PURE__*/ jsx(StepModal.Step, {
                title: t('chat.code-upload.step2-title', 'Confirm'),
                nextLabel: t('common.finish', 'Finish'),
                backLabel: t('form.button.back', 'Back'),
                disableNext: !projectAttachment || isLoading,
                children: /*#__PURE__*/ jsx(CodeConfirmationStep, {
                    projectName: projectName,
                    isLoading: isLoading,
                    error: error
                })
            })
        ]
    });
};

export { UploadCodeModal, UploadProjectToChatProvider, useUploadProjectToChat };
//# sourceMappingURL=UploadCodeModal.mjs.map
