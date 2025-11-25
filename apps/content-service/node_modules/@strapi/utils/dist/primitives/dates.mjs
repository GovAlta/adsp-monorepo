// Using timestamp (milliseconds) to be sure it is unique
// + converting timestamp to base 36 for better readibility
const timestampCode = (date)=>{
    const referDate = date ?? new Date();
    return referDate.getTime().toString(36);
};

export { timestampCode };
//# sourceMappingURL=dates.mjs.map
