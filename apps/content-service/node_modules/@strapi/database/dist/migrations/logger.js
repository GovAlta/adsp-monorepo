'use strict';

const transformLogMessage = (level, message)=>{
    if (typeof message === 'string') {
        return {
            level,
            message
        };
    }
    if (typeof message === 'object' && message !== null) {
        if ('event' in message && 'name' in message) {
            return {
                level,
                message: `[internal migration]: ${message.event} ${message?.name}`,
                timestamp: Date.now()
            };
        }
    }
    // NOTE: the message typing are too loose so in practice we should never arrive here.
    return '';
};

exports.transformLogMessage = transformLogMessage;
//# sourceMappingURL=logger.js.map
