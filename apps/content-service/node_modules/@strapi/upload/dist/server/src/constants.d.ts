declare const ACTIONS: {
    read: string;
    readSettings: string;
    create: string;
    update: string;
    download: string;
    copyLink: string;
    configureView: string;
};
declare const ALLOWED_SORT_STRINGS: string[];
declare const ALLOWED_WEBHOOK_EVENTS: {
    MEDIA_CREATE: string;
    MEDIA_UPDATE: string;
    MEDIA_DELETE: string;
};
declare const FOLDER_MODEL_UID = "plugin::upload.folder";
declare const FILE_MODEL_UID = "plugin::upload.file";
declare const API_UPLOAD_FOLDER_BASE_NAME = "API Uploads";
export { ACTIONS, FOLDER_MODEL_UID, FILE_MODEL_UID, API_UPLOAD_FOLDER_BASE_NAME, ALLOWED_SORT_STRINGS, ALLOWED_WEBHOOK_EVENTS, };
//# sourceMappingURL=constants.d.ts.map