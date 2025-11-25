export declare enum AssetType {
    Video = "video",
    Image = "image",
    Document = "doc",
    Audio = "audio"
}
export declare enum AssetSource {
    Url = "url",
    Computer = "computer"
}
export declare const PERMISSIONS: {
    main: {
        action: string;
        subject: null;
    }[];
    copyLink: {
        action: string;
        subject: null;
    }[];
    create: {
        action: string;
        subject: null;
    }[];
    download: {
        action: string;
        subject: null;
    }[];
    read: {
        action: string;
        subject: null;
    }[];
    configureView: {
        action: string;
        subject: null;
    }[];
    settings: {
        action: string;
        subject: null;
    }[];
    update: {
        action: string;
        subject: null;
        fields: null;
    }[];
};
export declare const tableHeaders: {
    name: string;
    key: string;
    metadatas: {
        label: {
            id: string;
            defaultMessage: string;
        };
        isSortable: boolean;
    };
    type: string;
}[];
export declare const sortOptions: {
    key: string;
    value: string;
}[];
export declare const pageSizes: number[];
export declare const localStorageKeys: {
    modalView: string;
    view: string;
};
export declare const viewOptions: {
    GRID: number;
    LIST: number;
};
