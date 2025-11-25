export interface FormAPI {
    components: {
        inputs: Record<string, any>;
        add: ({ id, component }: {
            id: string;
            component: any;
        }) => void;
    };
    types: {
        attribute: {
            [key: string]: {
                validators: any[];
                form: {
                    advanced: any[];
                    base: any[];
                };
            };
        };
        contentType: {
            validators: any[];
            form: {
                advanced: any[];
                base: any[];
            };
        };
        component: {
            validators: any[];
            form: {
                advanced: any[];
                base: any[];
            };
        };
    };
    contentTypeSchemaMutations: any[];
    addContentTypeSchemaMutation: (cb: any) => void;
    extendContentType: (data: any) => void;
    extendFields: (fields: any[], data: any) => void;
    getAdvancedForm: (target: any, props?: any) => any[];
    makeCustomFieldValidator: (attributeShape: any, validator: any, ...validatorArgs: any) => any;
    makeValidator: (target: any, initShape: any, ...args: any) => any;
    mutateContentTypeSchema: (data: Record<string, unknown>, initialData: Record<string, unknown>) => any;
}
export declare const formsAPI: FormAPI;
