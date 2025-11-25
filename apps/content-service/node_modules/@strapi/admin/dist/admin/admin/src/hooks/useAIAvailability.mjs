/**
 * @internal
 * @description Checks if the AI feature is enabled.
 */ const useAIAvailability = ()=>{
    const isAiEnabled = window.strapi.ai?.enabled !== false;
    const isEE = window.strapi?.isEE;
    return !!isEE && isAiEnabled;
};

export { useAIAvailability };
//# sourceMappingURL=useAIAvailability.mjs.map
