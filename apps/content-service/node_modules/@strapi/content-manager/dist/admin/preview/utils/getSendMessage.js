'use strict';

/**
 * A function factory so we can generate a new sendMessage everytime we need one.
 * We can't store and reuse a single sendMessage because it needs to have a stable identity
 * as it used in a useEffect function. And we can't rely on useCallback because we need the
 * up-to-date iframe ref, and this would make it stale (refs don't trigger callback reevaluations).
 */ function getSendMessage(iframe) {
    return (type, payload)=>{
        if (!iframe?.current) return;
        const { origin } = new URL(iframe.current.src);
        iframe.current.contentWindow?.postMessage({
            type,
            ...payload !== undefined && {
                payload
            }
        }, origin);
    };
}

exports.getSendMessage = getSendMessage;
//# sourceMappingURL=getSendMessage.js.map
