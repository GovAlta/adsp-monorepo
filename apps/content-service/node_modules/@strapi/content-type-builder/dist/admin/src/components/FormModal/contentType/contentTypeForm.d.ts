export declare const contentTypeForm: {
    advanced: {
        default(): {
            sections: {
                items: {
                    intlLabel: {
                        id: string;
                        defaultMessage: string;
                    };
                    description: {
                        id: string;
                        defaultMessage: string;
                    };
                    name: string;
                    type: string;
                    validations: {};
                }[];
            }[];
        };
    };
    base: {
        create(): {
            sections: {
                sectionTitle: null;
                items: ({
                    name: string;
                    type: string;
                    intlLabel: {
                        id: string;
                        defaultMessage: string;
                    };
                } | {
                    description: {
                        id: string;
                        defaultMessage: string;
                    };
                    intlLabel: {
                        id: string;
                        defaultMessage: string;
                    };
                    name: string;
                    type: string;
                    size?: undefined;
                } | {
                    type: string;
                    size: number;
                    intlLabel: {
                        id: string;
                        defaultMessage: string;
                    };
                    name: string;
                    description?: undefined;
                })[];
            }[];
        };
        edit(): {
            sections: {
                sectionTitle: null;
                items: ({
                    name: string;
                    type: string;
                    intlLabel: {
                        id: string;
                        defaultMessage: string;
                    };
                } | {
                    disabled: boolean;
                    description: {
                        id: string;
                        defaultMessage: string;
                    };
                    intlLabel: {
                        id: string;
                        defaultMessage: string;
                    };
                    name: string;
                    type: string;
                    size?: undefined;
                    radios?: undefined;
                } | {
                    type: string;
                    size: number;
                    intlLabel: {
                        id: string;
                        defaultMessage: string;
                    };
                    name: string;
                    disabled?: undefined;
                    description?: undefined;
                    radios?: undefined;
                } | {
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
                        value: string;
                    }[];
                    disabled?: undefined;
                    description?: undefined;
                })[];
            }[];
        };
    };
};
