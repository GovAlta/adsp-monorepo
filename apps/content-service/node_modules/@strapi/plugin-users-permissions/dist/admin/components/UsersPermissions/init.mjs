const init = (state, permissions, routes)=>{
    return {
        ...state,
        initialData: permissions,
        modifiedData: permissions,
        routes
    };
};

export { init as default };
//# sourceMappingURL=init.mjs.map
