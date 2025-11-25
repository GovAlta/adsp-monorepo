import type { Internal } from '@strapi/types';
declare const createUid: (name: string) => Internal.UID.ContentType;
declare const createComponentUid: (name: string, category: string) => Internal.UID.Component;
export { createComponentUid, createUid };
