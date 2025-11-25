function getValuesToClose(options, value) {
    const optionForValue = options.find((option)=>option.value === value);
    if (!optionForValue) {
        return [];
    }
    return options.filter((option)=>option.depth >= optionForValue.depth).map((option)=>option.value);
}

export { getValuesToClose };
//# sourceMappingURL=getValuesToClose.mjs.map
