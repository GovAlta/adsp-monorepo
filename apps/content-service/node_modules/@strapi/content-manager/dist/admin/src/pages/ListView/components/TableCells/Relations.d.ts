import type { CellContentProps } from './CellContent';
interface RelationSingleProps extends Pick<CellContentProps, 'mainField' | 'content'> {
}
declare const RelationSingle: ({ mainField, content }: RelationSingleProps) => import("react/jsx-runtime").JSX.Element;
interface RelationMultipleProps extends Pick<CellContentProps, 'mainField' | 'content' | 'name' | 'rowId'> {
}
/**
 * TODO: fix this component – tracking issue https://strapi-inc.atlassian.net/browse/CONTENT-2184
 */
declare const RelationMultiple: ({ mainField, content, rowId, name }: RelationMultipleProps) => import("react/jsx-runtime").JSX.Element;
export { RelationSingle, RelationMultiple };
export type { RelationSingleProps, RelationMultipleProps };
