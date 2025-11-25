import * as yup from 'yup';
import { CreateReleaseAction } from '../../../shared/contracts/release-actions';
import type { DocumentActionComponent } from '@strapi/content-manager/strapi-admin';
export declare const RELEASE_ACTION_FORM_SCHEMA: yup.default<import("yup/lib/object").Assign<import("yup/lib/object").ObjectShape, {
    type: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
    releaseId: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
}>, Record<string, any>, import("yup/lib/object").TypeOfShape<import("yup/lib/object").Assign<import("yup/lib/object").ObjectShape, {
    type: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
    releaseId: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
}>>, import("yup/lib/object").AssertsShape<import("yup/lib/object").Assign<import("yup/lib/object").ObjectShape, {
    type: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
    releaseId: import("yup/lib/string").RequiredStringSchema<string | undefined, Record<string, any>>;
}>>>;
export interface FormValues {
    type: CreateReleaseAction.Request['body']['type'];
    releaseId: CreateReleaseAction.Request['params']['releaseId'];
}
export declare const INITIAL_VALUES: {
    type: "publish";
    releaseId: string;
};
export declare const NoReleases: () => import("react/jsx-runtime").JSX.Element;
declare const ReleaseActionModalForm: DocumentActionComponent;
export { ReleaseActionModalForm };
