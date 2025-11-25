export declare const validateUpdateProjectSettings: (data: unknown) => {
    menuLogo?: string | null | undefined;
    authLogo?: string | null | undefined;
};
export declare const validateUpdateProjectSettingsFiles: (data: unknown) => {
    menuLogo?: {
        mimetype: "image/jpeg" | "image/png" | "image/svg+xml";
        size?: number | null | undefined;
        originalFilename?: string | null | undefined;
    } | null | undefined;
    authLogo?: {
        mimetype: "image/jpeg" | "image/png" | "image/svg+xml";
        size?: number | null | undefined;
        originalFilename?: string | null | undefined;
    } | null | undefined;
};
export declare const validateUpdateProjectSettingsImagesDimensions: (data: unknown) => {
    menuLogo?: {
        width?: number | null | undefined;
        height?: number | null | undefined;
    } | null | undefined;
    authLogo?: {
        width?: number | null | undefined;
        height?: number | null | undefined;
    } | null | undefined;
};
declare const _default: {
    validateUpdateProjectSettings: (data: unknown) => {
        menuLogo?: string | null | undefined;
        authLogo?: string | null | undefined;
    };
    validateUpdateProjectSettingsFiles: (data: unknown) => {
        menuLogo?: {
            mimetype: "image/jpeg" | "image/png" | "image/svg+xml";
            size?: number | null | undefined;
            originalFilename?: string | null | undefined;
        } | null | undefined;
        authLogo?: {
            mimetype: "image/jpeg" | "image/png" | "image/svg+xml";
            size?: number | null | undefined;
            originalFilename?: string | null | undefined;
        } | null | undefined;
    };
    validateUpdateProjectSettingsImagesDimensions: (data: unknown) => {
        menuLogo?: {
            width?: number | null | undefined;
            height?: number | null | undefined;
        } | null | undefined;
        authLogo?: {
            width?: number | null | undefined;
            height?: number | null | undefined;
        } | null | undefined;
    };
};
export default _default;
//# sourceMappingURL=project-settings.d.ts.map