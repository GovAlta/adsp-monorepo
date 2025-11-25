export declare const componentForm: {
    base(prefix?: string): ({
        sectionTitle: null;
        items: {
            name: string;
            type: string;
            intlLabel: {
                id: string;
                defaultMessage: string;
            };
        }[];
    } | {
        sectionTitle: null;
        items: {
            name: string;
            type: string;
            size: number;
            intlLabel: {
                id: string;
                defaultMessage: string;
            };
        }[];
    })[];
    advanced(): unknown[];
};
