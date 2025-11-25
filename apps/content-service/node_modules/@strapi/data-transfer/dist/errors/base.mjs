class DataTransferError extends Error {
    constructor(origin, severity, message, details){
        super(message);
        this.origin = origin;
        this.severity = severity;
        this.details = details ?? null;
    }
}

export { DataTransferError };
//# sourceMappingURL=base.mjs.map
