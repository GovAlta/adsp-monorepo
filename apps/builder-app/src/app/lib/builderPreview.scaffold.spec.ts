/** @jest-environment jsdom */
import { createPreviewScript } from './builderPreview.scaffold';

interface PreviewErrorMessage {
  type: string;
  message: string;
  stack: string;
}

async function waitFor(condition: () => boolean, timeoutMs = 5000): Promise<void> {
  const start = Date.now();
  while (!condition()) {
    if (Date.now() - start > timeoutMs) {
      throw new Error('Timed out waiting for the preview script to finish');
    }
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
}

// Runs the generated preview script in jsdom (where window.parent is window) and returns the
// preview-error messages it posts to the parent.
async function runPreview(
  files: Record<string, string>,
  { vendorBundleFails = false }: { vendorBundleFails?: boolean } = {},
): Promise<PreviewErrorMessage[]> {
  const received: PreviewErrorMessage[] = [];
  const onMessage = (event: MessageEvent) => {
    if (event.data?.type === 'preview-error') {
      received.push(event.data);
    }
  };
  window.addEventListener('message', onMessage);

  // jsdom does not load script elements; settle the vendor bundle load directly.
  jest.spyOn(document.head, 'appendChild').mockImplementation(((node: HTMLScriptElement) => {
    setTimeout(() => (vendorBundleFails ? node.onerror?.(new Event('error')) : node.onload?.(new Event('load'))));
    return node;
  }) as never);

  try {
    document.body.innerHTML = '<div id="preview-loading"></div>';
    new Function(createPreviewScript(JSON.stringify(files), 'null', 'https://example.test/vendors.js'))();

    // The script writes "Preview failed:" to the page before it posts to the parent, so wait for that
    // rather than a fixed delay, then let the posted message be delivered.
    await waitFor(() => (document.body.textContent ?? '').includes('Preview failed:'));
    await new Promise((resolve) => setTimeout(resolve, 25));
  } finally {
    window.removeEventListener('message', onMessage);
  }

  return received;
}

describe('preview script startup failures', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    delete (window as unknown as { Babel?: unknown }).Babel;
  });

  it('reports a compile error to the parent so it can be passed to the agent', async () => {
    (window as unknown as { Babel: unknown }).Babel = {
      transform: () => {
        throw new SyntaxError('/src/main.tsx: Expected corresponding JSX closing tag for <>. (135:12)');
      },
    };

    const messages = await runPreview({ 'src/main.tsx': 'export default <>' });

    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain('Preview failed:');
    expect(messages[0].message).toContain('Expected corresponding JSX closing tag for <>');
    expect(document.body.textContent).toContain('Preview failed:');
  });

  it('reports a missing entry file', async () => {
    const messages = await runPreview({ 'src/App.tsx': 'export default 1;' });

    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain('No preview entry file found');
  });

  it('does not report a vendor bundle load failure, which the agent cannot fix', async () => {
    const messages = await runPreview({ 'src/main.tsx': 'export default 1;' }, { vendorBundleFails: true });

    expect(messages).toHaveLength(0);
    expect(document.body.textContent).toContain('Failed to load vendor bundle');
  });
});
