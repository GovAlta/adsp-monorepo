import * as React from 'react';
import { renderHook as renderHookAdmin, render as renderAdmin, waitFor, act, screen, type RenderOptions } from '@strapi/admin/strapi-admin/test';
import { server } from './server';
declare const render: (ui: React.ReactElement, options?: RenderOptions) => ReturnType<typeof renderAdmin>;
declare const renderHook: typeof renderHookAdmin;
export { render, renderHook, waitFor, server, act, screen };
