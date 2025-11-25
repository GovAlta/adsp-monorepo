'use strict';

var open = require('open');

const openBrowser = async (config)=>{
    const url = config.get('admin.absoluteUrl');
    return open(url);
};

exports.openBrowser = openBrowser;
//# sourceMappingURL=open-browser.js.map
