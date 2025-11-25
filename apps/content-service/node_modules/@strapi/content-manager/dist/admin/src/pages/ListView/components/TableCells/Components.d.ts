import { CellContentProps } from './CellContent';
import type { Schema } from '@strapi/types';
interface SingleComponentProps extends Pick<CellContentProps, 'mainField'> {
    content: Schema.Attribute.Value<Schema.Attribute.Component<`${string}.${string}`, false>>;
}
declare const SingleComponent: ({ content, mainField }: SingleComponentProps) => import("react/jsx-runtime").JSX.Element | null;
interface RepeatableComponentProps extends Pick<CellContentProps, 'mainField'> {
    content: Schema.Attribute.Value<Schema.Attribute.Component<`${string}.${string}`, true>>;
}
declare const RepeatableComponent: ({ content, mainField }: RepeatableComponentProps) => import("react/jsx-runtime").JSX.Element | null;
export { SingleComponent, RepeatableComponent };
export type { SingleComponentProps, RepeatableComponentProps };
