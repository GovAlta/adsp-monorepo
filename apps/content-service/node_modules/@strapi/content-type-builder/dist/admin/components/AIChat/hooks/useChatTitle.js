'use strict';

var React = require('react');
var useAIFetch = require('./useAIFetch.js');

const useChatTitle = ({ chatId, messages })=>{
    const [title, setTitle] = React.useState(undefined);
    // Use the endpoint-specific hook
    const { fetch: fetchGenerateTitle, error, isPending: isGenerating } = useAIFetch.useFetchGenerateTitle();
    const generateTitle = React.useCallback(async ()=>{
        const firstMessage = messages.at(0);
        // Only generate title if there are messages and no title yet
        if (!firstMessage || title || isGenerating || error) {
            return;
        }
        const firstMessageContent = firstMessage.parts.map((content)=>content.type === 'text' ? content.text : '').join('\n');
        const result = await fetchGenerateTitle({
            body: {
                chatId,
                message: firstMessageContent
            }
        });
        if (result?.data) {
            setTitle(result.data.title);
        }
    }, [
        messages,
        title,
        isGenerating,
        error,
        fetchGenerateTitle,
        chatId
    ]);
    const resetTitle = React.useCallback(()=>{
        setTitle(undefined);
    }, []);
    return {
        title,
        isGenerating,
        error,
        generateTitle,
        resetTitle
    };
};

exports.useChatTitle = useChatTitle;
//# sourceMappingURL=useChatTitle.js.map
