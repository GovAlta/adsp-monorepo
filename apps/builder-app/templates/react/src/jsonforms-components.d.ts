declare module '@abgov/jsonforms-components' {
  import { ComponentType, ReactNode } from 'react';

  export const GoARenderers: unknown[];
  export const GoAReviewRenderers: unknown[];
  export const JsonFormRegisterProvider: ComponentType<{
    defaultRegisters?: unknown;
    children?: ReactNode;
  }>;

  export function ContextProviderFactory(): ComponentType<{
    children?: ReactNode;
    fileManagement?: unknown;
  }>;
}
