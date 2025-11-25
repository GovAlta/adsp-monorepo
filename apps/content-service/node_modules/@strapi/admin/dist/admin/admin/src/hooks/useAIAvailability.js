'use strict';

/**
 * @internal
 * @description Checks if the AI feature is enabled.
 */ const useAIAvailability = ()=>{
    const isAiEnabled = window.strapi.ai?.enabled !== false;
    const isEE = window.strapi?.isEE;
    return !!isEE && isAiEnabled;
};

exports.useAIAvailability = useAIAvailability;
//# sourceMappingURL=useAIAvailability.js.map
