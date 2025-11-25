/// <reference types="react" />
import type { Component, ContentType } from '../../types';
interface LinkToCMSettingsViewProps {
    disabled: boolean;
    type: Component | ContentType;
}
export declare const LinkToCMSettingsView: import("react").MemoExoticComponent<({ disabled, type }: LinkToCMSettingsViewProps) => import("react/jsx-runtime").JSX.Element | null>;
export {};
