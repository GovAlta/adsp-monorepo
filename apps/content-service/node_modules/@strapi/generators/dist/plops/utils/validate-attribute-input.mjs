var validateAttributeInput = ((input)=>{
    const regex = /^[A-Za-z-|_]+$/g;
    if (!input) {
        return 'You must provide an input';
    }
    return regex.test(input) || "Please use only letters, '-', '_',  and no spaces";
});

export { validateAttributeInput as default };
//# sourceMappingURL=validate-attribute-input.mjs.map
