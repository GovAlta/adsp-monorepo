'use strict';

var Context = require('../components/Context.js');

const [AppInfoProvider, useAppInfo] = Context.createContext('AppInfo', {});

exports.AppInfoProvider = AppInfoProvider;
exports.useAppInfo = useAppInfo;
//# sourceMappingURL=AppInfo.js.map
