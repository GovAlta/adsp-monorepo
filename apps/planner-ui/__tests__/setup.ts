/**
 * Vitest global test setup — MSW server + React Testing Library config.
 *
 * This file is referenced from vitest.config.ts / vite.config.ts setupFiles array.
 * It starts the MSW mock server before all tests and resets/closes it after.
 */

import '@testing-library/jest-dom';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';
import { server } from './handlers/sessions';

// Start MSW intercept server before test suite
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'warn' });
});

// Reset handlers between tests so one test cannot pollute another
afterEach(() => {
  server.resetHandlers();
});

// Close server after all tests complete
afterAll(() => {
  server.close();
});

// jsdom doesn't implement scrollIntoView — mock it globally so any component
// that calls ref.scrollIntoView() (e.g. PlanningSession message auto-scroll) does not throw.
window.HTMLElement.prototype.scrollIntoView = vi.fn();

// jsdom doesn't implement URL.createObjectURL / revokeObjectURL — mock them so
// client-side CSV/JSON download tests (SessionHistory, AuditLog) do not throw.
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = vi.fn();

// jsdom 25 does not implement Blob.prototype.text / arrayBuffer / stream.
// Add a FileReader-based polyfill so CSV/JSON export tests can call blob.text().
if (typeof Blob !== 'undefined' && typeof Blob.prototype.text === 'undefined') {
  Blob.prototype.text = function (): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.addEventListener('load', () => resolve(reader.result as string));
      reader.addEventListener('error', () => reject(reader.error));
      reader.readAsText(this);
    });
  };
}
