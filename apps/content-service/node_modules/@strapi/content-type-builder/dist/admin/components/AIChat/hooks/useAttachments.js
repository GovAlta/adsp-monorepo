'use strict';

var React = require('react');
var strapiAdmin = require('@strapi/admin/strapi-admin');
var constants = require('../lib/constants.js');
var misc = require('../lib/misc.js');
var ChatProvider = require('../providers/ChatProvider.js');
var useAIFetch = require('./useAIFetch.js');

function useAttachments() {
    const { setAttachments, attachments, id: chatId } = ChatProvider.useStrapiChat();
    const { toggleNotification } = strapiAdmin.useNotification();
    const { fetch: fetchUploadMedia } = useAIFetch.useFetchUploadMedia();
    /**
   * Add an attachment directly
   */ const addAttachments = React.useCallback((newAttachments)=>{
        // TODO: Limits
        if (!newAttachments) return;
        setAttachments((prev)=>[
                ...prev,
                ...newAttachments
            ]);
    }, [
        setAttachments
    ]);
    /**
   * Update an attachment
   */ const updateAttachment = React.useCallback((attachment)=>{
        setAttachments((prev)=>prev.map((a)=>a.id === attachment.id ? {
                    ...a,
                    ...attachment
                } : a));
    }, [
        setAttachments
    ]);
    /**
   * Remove an attachment
   */ const removeAttachment = React.useCallback((attachment)=>{
        setAttachments((prev)=>prev.filter((a)=>a.id !== attachment.id));
    }, [
        setAttachments
    ]);
    /**
   * Attach files to the chat
   */ const attachFiles = React.useCallback(async (newFiles, description)=>{
        // Attachment number limit
        const attachmentCount = attachments?.length || 0;
        const attachedFileCount = Array.from(newFiles).length;
        let limitedFiles = newFiles;
        if (attachmentCount + attachedFileCount > constants.STRAPI_MAX_ATTACHMENTS) {
            toggleNotification({
                type: 'danger',
                title: 'File limit reached: ',
                message: `You can only upload up to ${constants.STRAPI_MAX_ATTACHMENTS} files`
            });
            // Prune the ones that would exceed the limit
            const limit = constants.STRAPI_MAX_ATTACHMENTS - attachmentCount;
            limitedFiles = newFiles.slice(0, limit);
        }
        // Size limit
        for (const file of limitedFiles){
            if (file.size > constants.STRAPI_MAX_ATTACHMENT_SIZE) {
                toggleNotification({
                    type: 'danger',
                    title: 'File too large: ',
                    message: 'One of the files is too large (15MB limit)'
                });
                // Remove from list
                limitedFiles = limitedFiles.filter((f)=>f !== file);
            }
        }
        // Upload
        for (const file of limitedFiles){
            const pendingAttachment = {
                id: misc.generateId(),
                type: 'file',
                status: 'loading',
                filename: file.name,
                mediaType: file.type,
                url: ''
            };
            // Store the attachment as loading
            setAttachments((prev)=>[
                    ...prev,
                    pendingAttachment
                ]);
            // Prepare form data
            const formData = new FormData();
            formData.append('file', file);
            formData.append('fileInfo', JSON.stringify({
                name: file.name,
                chatId: chatId
            }));
            // Upload file
            fetchUploadMedia({
                formData
            }).then((result)=>{
                const attachment = result?.data;
                // Remove attachment if there is an error
                if (!result || result.error) {
                    toggleNotification({
                        type: 'danger',
                        title: 'Failed to upload file: ',
                        message: result?.error || 'Unknown error',
                        timeout: 5000
                    });
                    removeAttachment(pendingAttachment);
                    return;
                }
                // Update the pending attachment
                updateAttachment({
                    id: pendingAttachment.id,
                    url: attachment?.url || '',
                    status: 'ready'
                });
            }).catch(()=>removeAttachment(pendingAttachment));
        }
        if (description) {
            toggleNotification({
                title: 'Files attached',
                message: description
            });
        }
    }, [
        attachments,
        setAttachments,
        toggleNotification,
        chatId,
        fetchUploadMedia,
        removeAttachment,
        updateAttachment
    ]);
    /**
   * Remove an attachment by index
   */ const removeAttachmentByIndex = React.useCallback((index)=>{
        if (!attachments) return;
        setAttachments(attachments.filter((_, i)=>i !== index));
    }, [
        setAttachments,
        attachments
    ]);
    return {
        attachments,
        attachFiles,
        addAttachments,
        removeAttachment,
        removeAttachmentByIndex
    };
}

exports.useAttachments = useAttachments;
//# sourceMappingURL=useAttachments.js.map
