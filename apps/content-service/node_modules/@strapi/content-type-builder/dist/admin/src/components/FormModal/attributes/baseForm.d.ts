export declare const baseForm: {
    component(data: {
        createComponent: boolean;
    }, step: string): {
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
    } | {
        sections: ({
            sectionTitle: null;
            items: ({
                name: string;
                type: string;
                intlLabel: {
                    id: string;
                    defaultMessage: string;
                };
                description: {
                    id: string;
                    defaultMessage: string;
                };
            } | {
                name: string;
                type: string;
                intlLabel: {
                    id: string;
                    defaultMessage: string;
                };
                isMultiple: boolean;
            })[];
        } | {
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
        })[];
    };
    date(): {
        sections: {
            sectionTitle: null;
            items: ({
                name: string;
                type: string;
                intlLabel: {
                    id: string;
                    defaultMessage: string;
                };
                description: {
                    id: string;
                    defaultMessage: string;
                };
            } | {
                intlLabel: {
                    id: string;
                    defaultMessage: string;
                };
                name: string;
                type: string;
                options: ({
                    key: string;
                    value: string;
                    metadatas: {
                        intlLabel: {
                            id: string;
                            defaultMessage: string;
                            values?: undefined;
                        };
                        hidden: boolean;
                    };
                } | {
                    key: string;
                    value: string;
                    metadatas: {
                        intlLabel: {
                            id: string;
                            defaultMessage: string;
                            values: {
                                currentYear: number;
                            };
                        };
                        hidden?: undefined;
                    };
                } | {
                    key: string;
                    value: string;
                    metadatas: {
                        intlLabel: {
                            id: string;
                            defaultMessage: string;
                            values?: undefined;
                        };
                        hidden?: undefined;
                    };
                })[];
            })[];
        }[];
    };
    enumeration(): {
        sections: ({
            sectionTitle: null;
            items: {
                name: string;
                type: string;
                intlLabel: {
                    id: string;
                    defaultMessage: string;
                };
                description: {
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
                placeholder: {
                    id: string;
                    defaultMessage: string;
                };
                validations: {
                    required: boolean;
                };
            }[];
        })[];
    };
    media(): {
        sections: ({
            sectionTitle: null;
            items: {
                name: string;
                type: string;
                intlLabel: {
                    id: string;
                    defaultMessage: string;
                };
                description: {
                    id: string;
                    defaultMessage: string;
                };
            }[];
        } | {
            sectionTitle: null;
            items: {
                intlLabel: {
                    id: string;
                    defaultMessage: string;
                };
                name: string;
                size: number;
                type: string;
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
        })[];
    };
    number(): {
        sections: {
            sectionTitle: null;
            items: ({
                name: string;
                type: string;
                intlLabel: {
                    id: string;
                    defaultMessage: string;
                };
                description: {
                    id: string;
                    defaultMessage: string;
                };
            } | {
                intlLabel: {
                    id: string;
                    defaultMessage: string;
                };
                name: string;
                type: string;
                options: ({
                    key: string;
                    value: string;
                    metadatas: {
                        intlLabel: {
                            id: string;
                            defaultMessage: string;
                        };
                        hidden: boolean;
                    };
                } | {
                    key: string;
                    value: string;
                    metadatas: {
                        intlLabel: {
                            id: string;
                            defaultMessage: string;
                        };
                        hidden?: undefined;
                    };
                })[];
            })[];
        }[];
    };
    relation(): {
        sections: {
            sectionTitle: null;
            items: {
                intlLabel: {
                    id: string;
                    defaultMessage: string;
                };
                name: string;
                size: number;
                type: string;
            }[];
        }[];
    };
    string(): {
        sections: ({
            sectionTitle: null;
            items: {
                name: string;
                type: string;
                intlLabel: {
                    id: string;
                    defaultMessage: string;
                };
                description: {
                    id: string;
                    defaultMessage: string;
                };
            }[];
        } | {
            sectionTitle: null;
            items: {
                intlLabel: {
                    id: string;
                    defaultMessage: string;
                };
                name: string;
                size: number;
                type: string;
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
            }[];
        })[];
    };
    text(): {
        sections: ({
            sectionTitle: null;
            items: {
                name: string;
                type: string;
                intlLabel: {
                    id: string;
                    defaultMessage: string;
                };
                description: {
                    id: string;
                    defaultMessage: string;
                };
            }[];
        } | {
            sectionTitle: null;
            items: {
                intlLabel: {
                    id: string;
                    defaultMessage: string;
                };
                name: string;
                size: number;
                type: string;
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
            }[];
        })[];
    };
    uid(_data: unknown, step: string, attributes: Array<{
        type: string;
        name: string;
    }>): {
        sections: {
            sectionTitle: null;
            items: ({
                placeholder: {
                    id: string;
                    defaultMessage: string;
                };
                name: string;
                type: string;
                intlLabel: {
                    id: string;
                    defaultMessage: string;
                };
                description: {
                    id: string;
                    defaultMessage: string;
                };
                options?: undefined;
            } | {
                intlLabel: {
                    id: string;
                    defaultMessage: string;
                };
                name: string;
                type: string;
                options: {
                    key: string;
                    value: string;
                    metadatas: {
                        intlLabel: {
                            id: string;
                            defaultMessage: string;
                        };
                    };
                }[];
            })[];
        }[];
    };
};
