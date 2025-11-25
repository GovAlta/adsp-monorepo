'use strict';

var ee = require('@strapi/admin/strapi-admin/ee');
var useSettings = require('./useSettings.js');

const useAIAvailability = ()=>{
    const isAiAvailable = ee.useAIAvailability();
    const { status, data } = useSettings.useSettings(isAiAvailable);
    if (!isAiAvailable) {
        return {
            status: 'success',
            isEnabled: false
        };
    }
    return {
        status,
        isEnabled: data?.aiMetadata
    };
};

exports.useAIAvailability = useAIAvailability;
//# sourceMappingURL=useAiAvailability.js.map
