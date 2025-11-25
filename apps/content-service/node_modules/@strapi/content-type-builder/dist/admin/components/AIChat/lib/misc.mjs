const generateId = (size = 16)=>{
    return crypto.randomUUID().slice(0, size);
};

export { generateId };
//# sourceMappingURL=misc.mjs.map
