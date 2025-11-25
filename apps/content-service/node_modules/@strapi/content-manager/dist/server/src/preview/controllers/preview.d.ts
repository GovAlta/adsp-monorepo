declare const createPreviewController: () => {
    /**
     * Transforms an entry into a preview URL, so that it can be previewed
     * in the Content Manager.
     */
    getPreviewUrl(ctx: import("koa").Context): Promise<{
        data: {
            url: string | undefined;
        };
    }>;
};
export { createPreviewController };
//# sourceMappingURL=preview.d.ts.map