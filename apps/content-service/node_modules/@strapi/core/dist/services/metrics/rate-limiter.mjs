function nextResetDate() {
    return Date.now() + 24 * 60 * 60 * 1000; // Now + 24 hours.
}
var wrapWithRateLimit = ((sender, { limitedEvents = [] } = {})=>{
    let cacheExpiresAt = nextResetDate();
    const eventCache = new Map();
    return async (event, ...args)=>{
        if (!limitedEvents.includes(event)) {
            return sender(event, ...args);
        }
        if (Date.now() > cacheExpiresAt) {
            eventCache.clear();
            cacheExpiresAt = nextResetDate();
        }
        if (eventCache.has(event)) {
            return false;
        }
        eventCache.set(event, true);
        return sender(event, ...args);
    };
});

export { wrapWithRateLimit as default };
//# sourceMappingURL=rate-limiter.mjs.map
