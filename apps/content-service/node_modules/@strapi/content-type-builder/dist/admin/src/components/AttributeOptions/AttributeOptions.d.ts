/**
 *
 * AttributeOptions
 *
 */
import { IconByType } from '../AttributeIcon';
type AttributeOptionsProps = {
    attributes: IconByType[][];
    forTarget: string;
    kind: string;
};
export declare const AttributeOptions: ({ attributes, forTarget, kind }: AttributeOptionsProps) => import("react/jsx-runtime").JSX.Element;
export {};
