import * as React from 'react';
import { Modal } from '@strapi/design-system';
export type LimitsModalProps = Pick<Modal.Props, 'open' | 'onOpenChange'>;
declare const LimitsModal: {
    Title: React.FC<{
        children?: React.ReactNode;
    }>;
    Body: React.FC<{
        children?: React.ReactNode;
    }>;
    Root: React.FC<React.PropsWithChildren<LimitsModalProps>>;
};
export { LimitsModal };
