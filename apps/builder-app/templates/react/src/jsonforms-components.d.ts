declare module '@abgov/jsonforms-components' {
  import type Ajv from 'ajv';
  import { ComponentType, ReactNode } from 'react';

  export const GoARenderers: unknown[];
  export const GoAReviewRenderers: unknown[];
  export const JsonFormRegisterProvider: ComponentType<{
    defaultRegisters?: unknown;
    children?: ReactNode;
  }>;

  export function createDefaultAjv(...schemas: unknown[]): Ajv;
  export function tryResolveRefs(
    schema: Record<string, unknown>,
    ...refSchemas: unknown[]
  ): Promise<[Record<string, unknown>, unknown?]>;

  export function ContextProviderFactory(): ComponentType<{
    children?: ReactNode;
    fileManagement?: unknown;
  }>;
}
