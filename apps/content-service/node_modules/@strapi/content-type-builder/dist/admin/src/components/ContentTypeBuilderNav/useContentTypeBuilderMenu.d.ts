/// <reference types="react" />
import type { Status } from '../../types';
type Link = {
    name: string;
    to: string;
    status: Status;
    title: string;
};
type SubSection = {
    name: string;
    title: string;
    links: Link[];
};
type MenuSection = {
    name: string;
    title: {
        id: string;
        defaultMessage: string;
    };
    customLink?: {
        id: string;
        defaultMessage: string;
        onClick: () => void;
    };
    links: Array<SubSection | Link>;
    linksCount?: number;
};
type Menu = MenuSection[];
export declare const useContentTypeBuilderMenu: () => {
    menu: Menu;
    search: {
        value: string;
        onChange: import("react").Dispatch<import("react").SetStateAction<string>>;
        clear: () => void;
    };
};
export {};
