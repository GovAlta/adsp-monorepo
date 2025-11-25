const isErrorMessageMessageDescriptor = (message)=>{
    return typeof message === 'object' && message !== null && 'id' in message;
};

export { isErrorMessageMessageDescriptor };
//# sourceMappingURL=forms.mjs.map
