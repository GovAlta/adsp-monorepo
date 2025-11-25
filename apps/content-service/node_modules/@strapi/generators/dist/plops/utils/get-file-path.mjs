var getFilePath = ((destination)=>{
    if (destination === 'api') {
        return `api/{{ api }}`;
    }
    if (destination === 'plugin') {
        return `plugins/{{ plugin }}/server`;
    }
    if (destination === 'root') {
        return './';
    }
    return `api/{{ id }}`;
});

export { getFilePath as default };
//# sourceMappingURL=get-file-path.mjs.map
