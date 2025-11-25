'use strict';

var useAIUsageWarning = require('../hooks/useAIUsageWarning.js');

const GlobalNotifications = ()=>{
    useAIUsageWarning.useAIUsageWarning();
    return null;
};

exports.GlobalNotifications = GlobalNotifications;
//# sourceMappingURL=GlobalNotifications.js.map
