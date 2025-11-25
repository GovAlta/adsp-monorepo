var getFormattedDate = ((date = new Date())=>{
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toJSON().replace(/[-:]/g, '.').replace(/\....Z/, '');
});

export { getFormattedDate as default };
//# sourceMappingURL=get-formatted-date.mjs.map
