import open from 'open';

const openBrowser = async (config)=>{
    const url = config.get('admin.absoluteUrl');
    return open(url);
};

export { openBrowser };
//# sourceMappingURL=open-browser.mjs.map
