const trackEvent = async (ctx, cloudApiService, eventName, eventData)=>{
    try {
        await cloudApiService.track(eventName, eventData);
    } catch (e) {
        ctx.logger.debug(`Failed to track ${eventName}`, e);
    }
};

export { trackEvent };
//# sourceMappingURL=analytics.mjs.map
