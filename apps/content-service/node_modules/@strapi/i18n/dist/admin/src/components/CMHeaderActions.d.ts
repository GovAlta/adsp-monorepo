import { type DocumentActionComponent, HeaderActionProps } from '@strapi/content-manager/strapi-admin';
import type { Locale } from '../../../shared/contracts/locales';
import type { Modules } from '@strapi/types';
declare const LocalePickerAction: ({ document, meta, model, collectionType, documentId, }: HeaderActionProps) => {
    label: string;
    options: {
        disabled: boolean;
        value: string;
        label: import("react/jsx-runtime").JSX.Element;
        startIcon: import("react/jsx-runtime").JSX.Element | null;
    }[];
    customizeContent: () => string | undefined;
    onSelect: (value: string) => void;
    value: Locale | undefined;
} | null;
declare const FillFromAnotherLocaleAction: ({ documentId, meta, model, collectionType, }: HeaderActionProps) => {
    type: string;
    icon: import("react/jsx-runtime").JSX.Element;
    disabled: boolean;
    label: string;
    dialog: {
        type: string;
        title: string;
        content: ({ onClose }: {
            onClose: () => void;
        }) => import("react/jsx-runtime").JSX.Element;
    };
} | null;
declare const DeleteLocaleAction: DocumentActionComponent;
export type LocaleStatus = {
    locale: string;
    status: Modules.Documents.Params.PublicationStatus.Kind | 'modified';
};
declare const BulkLocalePublishAction: DocumentActionComponent;
declare const BulkLocaleUnpublishAction: DocumentActionComponent;
export { BulkLocalePublishAction, BulkLocaleUnpublishAction, DeleteLocaleAction, LocalePickerAction, FillFromAnotherLocaleAction, };
