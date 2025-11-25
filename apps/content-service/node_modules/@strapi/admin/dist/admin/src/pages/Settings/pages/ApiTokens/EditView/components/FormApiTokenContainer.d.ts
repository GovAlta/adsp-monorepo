import * as React from 'react';
import { FormikErrors } from 'formik';
import type { ApiToken } from '../../../../../../../../shared/contracts/api-token';
interface FormApiTokenContainerProps {
    errors?: FormikErrors<Pick<ApiToken, 'name' | 'description' | 'lifespan' | 'type'>>;
    onChange: ({ target: { name, value } }: {
        target: {
            name: string;
            value: string;
        };
    }) => void;
    canEditInputs: boolean;
    values?: Partial<Pick<ApiToken, 'name' | 'description' | 'lifespan' | 'type'>>;
    isCreating: boolean;
    apiToken?: null | Partial<ApiToken>;
    onDispatch: React.Dispatch<any>;
    setHasChangedPermissions: (hasChanged: boolean) => void;
}
export declare const FormApiTokenContainer: ({ errors, onChange, canEditInputs, isCreating, values, apiToken, onDispatch, setHasChangedPermissions, }: FormApiTokenContainerProps) => import("react/jsx-runtime").JSX.Element;
export {};
