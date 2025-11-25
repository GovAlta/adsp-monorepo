import { attributesForm } from '../attributes/form';
import { attributeTypes } from '../attributes/types';
import { FormTypeOptions } from './utils/addItemsToFormSection';
import { Attribute, SchemaData } from './utils/getUsedAttributeNames';
import type { ContentType } from '../../../types';
import type { Internal } from '@strapi/types';
export type SchemaParams = {
    schemaAttributes: any;
    attributeType: keyof typeof attributeTypes;
    customFieldValidator: any;
    reservedNames: {
        attributes: Array<string>;
    };
    schemaData: any;
    ctbFormsAPI: any;
};
type Base<TAttributesFormType extends 'base' | 'advanced'> = {
    data: any;
    type: keyof (typeof attributesForm)[TAttributesFormType];
    step: string;
    attributes: any;
    extensions: any;
    forTarget: string;
};
export declare const forms: {
    customField: {
        schema({ schemaAttributes, attributeType, customFieldValidator, reservedNames, schemaData, ctbFormsAPI, }: SchemaParams): any;
        form: {
            base({ customField }: any): {
                sections: FormTypeOptions;
            };
            advanced({ customField, data, step, extensions, ...rest }: any): {
                sections: FormTypeOptions;
            };
        };
    };
    attribute: {
        schema(currentSchema: any, attributeType: keyof typeof attributeTypes, reservedNames: {
            attributes: Array<string>;
        }, alreadyTakenTargetContentTypeAttributes: Array<Attribute>, options: SchemaData, extensions: {
            makeValidator: any;
        }): any;
        form: {
            advanced({ data, type, step, extensions, ...rest }: Base<'advanced'>): {
                sections: any[];
            };
            base({ data, type, step, attributes }: Base<'base'>): {
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
        };
    };
    contentType: {
        schema(alreadyTakenNames: Array<string>, isEditing: boolean, ctUid: Internal.UID.ContentType, reservedNames: {
            models: any;
        }, extensions: any, contentTypes: Record<Internal.UID.ContentType, ContentType>): any;
        form: {
            base({ actionType }: any): {
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
            advanced({ extensions }: any): {
                sections: {
                    items: any[];
                }[];
            };
        };
    };
    component: {
        schema(alreadyTakenAttributes: Array<Internal.UID.Component>, componentCategory: string, reservedNames: {
            models: any;
        }, isEditing: boolean | undefined, components: Record<string, any>, componentDisplayName: string, compoUid?: Internal.UID.Component | null): import("yup/lib/object").OptionalObjectSchema<{
            displayName: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
            category: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
            icon: import("yup").StringSchema<string | undefined, Record<string, any>, string | undefined>;
        }, Record<string, any>, import("yup/lib/object").TypeOfShape<{
            displayName: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
            category: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
            icon: import("yup").StringSchema<string | undefined, Record<string, any>, string | undefined>;
        }>>;
        form: {
            advanced(): {
                sections: unknown[];
            };
            base(): {
                sections: ({
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
            };
        };
    };
    addComponentToDynamicZone: {
        form: {
            advanced(): {
                sections: unknown[];
            };
            base({ data }: any): {
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
        };
    };
};
export {};
