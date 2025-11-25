'use strict';

const useAIAvailability = ()=>{
    const isAiEnabled = window.strapi.ai?.enabled !== false;
    const isEE = window.strapi?.isEE;
    const isAiFeatureEnabled = window.strapi.features.isEnabled('cms-ai');
    return !!isEE && isAiEnabled && isAiFeatureEnabled;
};

exports.useAIAvailability = useAIAvailability;
//# sourceMappingURL=useAIAvailability.js.map
