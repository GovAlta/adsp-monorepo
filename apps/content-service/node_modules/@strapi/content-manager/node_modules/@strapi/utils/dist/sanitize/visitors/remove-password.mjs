const visitor = ({ key, attribute }, { remove })=>{
    if (attribute?.type === 'password') {
        remove(key);
    }
};

export { visitor as default };
//# sourceMappingURL=remove-password.mjs.map
