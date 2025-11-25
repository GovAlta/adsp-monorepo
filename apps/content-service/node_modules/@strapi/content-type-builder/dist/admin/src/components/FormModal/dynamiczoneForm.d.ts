export declare const dynamiczoneForm: {
    advanced: {
        default(): {
            sections: unknown[];
        };
    };
    base: {
        createComponent(): {
            sections: {
                sectionTitle: null;
                items: {
                    name: string;
                    type: string;
                    intlLabel: {
                        id: string;
                        defaultMessage: string;
                    };
                }[];
            }[];
        };
        default(): {
            sections: ({
                sectionTitle: null;
                items: {
                    intlLabel: {
                        id: string;
                        defaultMessage: string;
                    };
                    name: string;
                    type: string;
                    size: number;
                    radios: {
                        title: {
                            id: string;
                            defaultMessage: string;
                        };
                        description: {
                            id: string;
                            defaultMessage: string;
                        };
                        value: boolean;
                    }[];
                }[];
            } | {
                sectionTitle: null;
                items: ({
                    type: string;
                    size: number;
                    intlLabel: {
                        id: string;
                        defaultMessage: string;
                    };
                    name: string;
                    isMultiple?: undefined;
                } | {
                    name: string;
                    type: string;
                    intlLabel: {
                        id: string;
                        defaultMessage: string;
                    };
                    isMultiple: boolean;
                    size?: undefined;
                })[];
            })[];
        };
    };
};
