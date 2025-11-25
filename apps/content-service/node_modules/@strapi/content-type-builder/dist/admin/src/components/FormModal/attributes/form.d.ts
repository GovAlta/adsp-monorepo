export declare const attributesForm: {
    advanced: {
        blocks(): {
            sections: ({
                sectionTitle: {
                    id: string;
                    defaultMessage: string;
                };
                intlLabel: {
                    id: string;
                    defaultMessage: string;
                };
                items: {
                    name: string;
                    type: string;
                    intlLabel: {
                        id: string;
                        defaultMessage: string;
                    };
                    validations: {
                        required: boolean;
                    };
                }[];
            } | {
                sectionTitle: {
                    id: string;
                    defaultMessage: string;
                };
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
            })[];
        };
        boolean(): {
            sections: ({
                sectionTitle: {
                    id: string;
                    defaultMessage: string;
                };
                intlLabel: {
                    id: string;
                    defaultMessage: string;
                };
                items: {
                    name: string;
                    type: string;
                    intlLabel: {
                        id: string;
                        defaultMessage: string;
                    };
                    validations: {
                        required: boolean;
                    };
                }[];
            } | {
                sectionTitle: null;
                items: {
                    autoFocus: boolean;
                    type: string;
                    intlLabel: {
                        id: string;
                        defaultMessage: string;
                    };
                    name: string;
                    options: {
                        value: string;
                        key: string;
                        metadatas: {
                            intlLabel: {
                                id: string;
                                defaultMessage: string;
                            };
                        };
                    }[];
                }[];
            } | {
                sectionTitle: {
                    id: string;
                    defaultMessage: string;
                };
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
            })[];
        };
        component({ repeatable }: {
            repeatable: boolean;
        }, step: string): {
            sections: unknown[];
        };
        date({ type }: {
            type: string;
        }): {
            sections: ({
                sectionTitle: {
                    id: string;
                    defaultMessage: string;
                };
                intlLabel: {
                    id: string;
                    defaultMessage: string;
                };
                items: {
                    name: string;
                    type: string;
                    intlLabel: {
                        id: string;
                        defaultMessage: string;
                    };
                    validations: {
                        required: boolean;
                    };
                }[];
            } | {
                sectionTitle: null;
                items: {
                    type: string;
                    value: null;
                    withDefaultValue: boolean;
                    disabled: boolean;
                    autoFocus: boolean;
                    name: string;
                    intlLabel: {
                        id: string;
                        defaultMessage: string;
                    };
                }[];
            } | {
                sectionTitle: {
                    id: string;
                    defaultMessage: string;
                };
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
            })[];
        };
        dynamiczone(): {
            sections: ({
                sectionTitle: {
                    id: string;
                    defaultMessage: string;
                };
                intlLabel: {
                    id: string;
                    defaultMessage: string;
                };
                items: {
                    name: string;
                    type: string;
                    intlLabel: {
                        id: string;
                        defaultMessage: string;
                    };
                    validations: {
                        required: boolean;
                    };
                }[];
            } | {
                sectionTitle: {
                    id: string;
                    defaultMessage: string;
                };
                items: {
                    name: string;
                    type: string;
                    intlLabel: {
                        id: string;
                        defaultMessage: string;
                    };
                }[];
            })[];
        };
        email(): {
            sections: ({
                sectionTitle: {
                    id: string;
                    defaultMessage: string;
                };
                intlLabel: {
                    id: string;
                    defaultMessage: string;
                };
                items: {
                    name: string;
                    type: string;
                    intlLabel: {
                        id: string;
                        defaultMessage: string;
                    };
                    validations: {
                        required: boolean;
                    };
                }[];
            } | {
                sectionTitle: null;
                items: {
                    type: string;
                    name: string;
                    intlLabel: {
                        id: string;
                        defaultMessage: string;
                    };
                }[];
            } | {
                sectionTitle: {
                    id: string;
                    defaultMessage: string;
                };
                items: {
                    name: string;
                    type: string;
                    intlLabel: {
                        id: string;
                        defaultMessage: string;
                    };
                }[];
            })[];
        };
        enumeration(data: {
            enum: string[];
        }): {
            sections: ({
                sectionTitle: {
                    id: string;
                    defaultMessage: string;
                };
                intlLabel: {
                    id: string;
                    defaultMessage: string;
                };
                items: {
                    name: string;
                    type: string;
                    intlLabel: {
                        id: string;
                        defaultMessage: string;
                    };
                    validations: {
                        required: boolean;
                    };
                }[];
            } | {
                sectionTitle: null;
                items: ({
                    name: string;
                    type: string;
                    intlLabel: {
                        id: string;
                        defaultMessage: string;
                    };
                    validations: {};
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
                    description?: undefined;
                } | {
                    intlLabel: {
                        id: string;
                        defaultMessage: string;
                    };
                    name: string;
                    type: string;
                    validations: {};
                    description: {
                        id: string;
                        defaultMessage: string;
                    };
                    options?: undefined;
                })[];
            } | {
                sectionTitle: {
                    id: string;
                    defaultMessage: string;
                };
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
            })[];
        };
        json(): {
            sections: ({
                sectionTitle: {
                    id: string;
                    defaultMessage: string;
                };
                intlLabel: {
                    id: string;
                    defaultMessage: string;
                };
                items: {
                    name: string;
                    type: string;
                    intlLabel: {
                        id: string;
                        defaultMessage: string;
                    };
                    validations: {
                        required: boolean;
                    };
                }[];
            } | {
                sectionTitle: {
                    id: string;
                    defaultMessage: string;
                };
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
            })[];
        };
        media(): {
            sections: ({
                sectionTitle: {
                    id: string;
                    defaultMessage: string;
                };
                intlLabel: {
                    id: string;
                    defaultMessage: string;
                };
                items: {
                    name: string;
                    type: string;
                    intlLabel: {
                        id: string;
                        defaultMessage: string;
                    };
                    validations: {
                        required: boolean;
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
                    type: string;
                    size: number;
                    value: string;
                    validations: {};
                }[];
            } | {
                sectionTitle: {
                    id: string;
                    defaultMessage: string;
                };
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
            })[];
        };
        number(data: {
            type: "string" | "decimal" | "biginteger" | "float" | "integer";
        }): {
            sections: ({
                sectionTitle: {
                    id: string;
                    defaultMessage: string;
                };
                intlLabel: {
                    id: string;
                    defaultMessage: string;
                };
                items: {
                    name: string;
                    type: string;
                    intlLabel: {
                        id: string;
                        defaultMessage: string;
                    };
                    validations: {
                        required: boolean;
                    };
                }[];
            } | {
                sectionTitle: null;
                items: {
                    autoFocus: boolean;
                    name: string;
                    type: string;
                    step: string | number;
                    intlLabel: {
                        id: string;
                        defaultMessage: string;
                    };
                    validations: {};
                }[];
            } | {
                sectionTitle: {
                    id: string;
                    defaultMessage: string;
                };
                items: {
                    name: string;
                    type: string;
                    intlLabel: {
                        id: string;
                        defaultMessage: string;
                    };
                }[];
            })[];
        };
        password(): {
            sections: ({
                sectionTitle: {
                    id: string;
                    defaultMessage: string;
                };
                intlLabel: {
                    id: string;
                    defaultMessage: string;
                };
                items: {
                    name: string;
                    type: string;
                    intlLabel: {
                        id: string;
                        defaultMessage: string;
                    };
                    validations: {
                        required: boolean;
                    };
                }[];
            } | {
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
                sectionTitle: {
                    id: string;
                    defaultMessage: string;
                };
                items: {
                    name: string;
                    type: string;
                    intlLabel: {
                        id: string;
                        defaultMessage: string;
                    };
                }[];
            })[];
        };
        relation(): {
            sections: ({
                sectionTitle: {
                    id: string;
                    defaultMessage: string;
                };
                intlLabel: {
                    id: string;
                    defaultMessage: string;
                };
                items: {
                    name: string;
                    type: string;
                    intlLabel: {
                        id: string;
                        defaultMessage: string;
                    };
                    validations: {
                        required: boolean;
                    };
                }[];
            } | {
                sectionTitle: {
                    id: string;
                    defaultMessage: string;
                };
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
            })[];
        };
        richtext(): {
            sections: ({
                sectionTitle: {
                    id: string;
                    defaultMessage: string;
                };
                intlLabel: {
                    id: string;
                    defaultMessage: string;
                };
                items: {
                    name: string;
                    type: string;
                    intlLabel: {
                        id: string;
                        defaultMessage: string;
                    };
                    validations: {
                        required: boolean;
                    };
                }[];
            } | {
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
                sectionTitle: {
                    id: string;
                    defaultMessage: string;
                };
                items: {
                    name: string;
                    type: string;
                    intlLabel: {
                        id: string;
                        defaultMessage: string;
                    };
                }[];
            })[];
        };
        text(): {
            sections: ({
                sectionTitle: {
                    id: string;
                    defaultMessage: string;
                };
                intlLabel: {
                    id: string;
                    defaultMessage: string;
                };
                items: {
                    name: string;
                    type: string;
                    intlLabel: {
                        id: string;
                        defaultMessage: string;
                    };
                    validations: {
                        required: boolean;
                    };
                }[];
            } | {
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
                sectionTitle: {
                    id: string;
                    defaultMessage: string;
                };
                items: {
                    name: string;
                    type: string;
                    intlLabel: {
                        id: string;
                        defaultMessage: string;
                    };
                }[];
            })[];
        };
        uid(data: {
            targetField: string;
        }): {
            sections: ({
                sectionTitle: {
                    id: string;
                    defaultMessage: string;
                };
                intlLabel: {
                    id: string;
                    defaultMessage: string;
                };
                items: {
                    name: string;
                    type: string;
                    intlLabel: {
                        id: string;
                        defaultMessage: string;
                    };
                    validations: {
                        required: boolean;
                    };
                }[];
            } | {
                sectionTitle: null;
                items: {
                    disabled: boolean;
                    type: string;
                    name: string;
                    intlLabel: {
                        id: string;
                        defaultMessage: string;
                    };
                }[];
            } | {
                sectionTitle: {
                    id: string;
                    defaultMessage: string;
                };
                items: {
                    name: string;
                    type: string;
                    intlLabel: {
                        id: string;
                        defaultMessage: string;
                    };
                }[];
            })[];
        };
    };
    base: {
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
        uid(_data: unknown, step: string, attributes: {
            type: string;
            name: string;
        }[]): {
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
};
