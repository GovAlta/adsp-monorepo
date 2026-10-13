import React from 'react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { act, fireEvent, render, screen } from '@testing-library/react';

import { COPIED_DISPLAY_MS } from '@components/CopyLink/CopyLinkIcon';
import { TokenHandlerProxyInfo } from './TokenHandlerProxyInfo';

describe('TokenHandlerProxyInfo', () => {
  const mockStore = configureStore([]);
  const writeText = jest.fn();

  const state = {
    config: { serviceUrls: { tokenHandlerApiUrl: 'https://token-handler.example.ca' } },
    tenant: { name: 'My Tenant' },
  };

  const renderInfo = (storeState: Record<string, unknown> = state, targetIds = ['form-api']) =>
    render(
      <Provider store={mockStore(storeState)}>
        <TokenHandlerProxyInfo clientId="my-client" targetIds={targetIds} />
      </Provider>,
    );

  const configText = () => screen.getByTestId('nginx-config').textContent;
  const copyButton = (container: HTMLElement) => container.querySelector('goa-button[testid="copy-nginx-config-btn"]');
  const click = async (element: Element) => {
    await act(async () => {
      fireEvent(element, new CustomEvent('_click'));
    });
  };

  beforeEach(() => {
    jest.useFakeTimers();
    writeText.mockReset();
    Object.assign(navigator, { clipboard: { writeText } });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('shows the nginx configuration for the client', () => {
    renderInfo();

    const text = configText();
    expect(text).toContain('location /token-handler/ {');
    expect(text).toContain('proxy_pass https://token-handler.example.ca/token-handler/v1/;');
    expect(text).toContain('/auth?tenant=My%20Tenant&callbackUrl=<callback URL>');
  });

  it('shows the paths that the application uses for the client', () => {
    renderInfo();

    const text = configText();
    expect(text).toContain('/token-handler/clients/my-client/auth?tenant=My%20Tenant&callbackUrl=<callback URL>');
    expect(text).toContain('/token-handler/clients/my-client/callback');
    expect(text).toContain('/token-handler/clients/my-client/logout');
    expect(text).toContain('/token-handler/sessions');
  });

  it('shows the path for each target', () => {
    renderInfo(state, ['form-api', 'file-api']);

    const text = configText();
    expect(text).toMatch(/Target form-api: +\/token-handler\/targets\/form-api\/\.\.\./);
    expect(text).toMatch(/Target file-api: +\/token-handler\/targets\/file-api\/\.\.\./);
  });

  it('shows that there are no targets', () => {
    renderInfo(state, []);

    expect(configText()).toContain('No targets are configured');
  });

  it('uses placeholders when the token handler URL and tenant are not available', () => {
    renderInfo({ config: { serviceUrls: {} }, tenant: {} });

    const text = configText();
    expect(text).toContain('proxy_pass <token handler URL>/token-handler/v1/;');
    expect(text).toContain('/auth?tenant=<tenant name>&callbackUrl=<callback URL>');
  });

  it('can copy the configuration', async () => {
    writeText.mockResolvedValue(undefined);
    const { container } = renderInfo();

    await click(copyButton(container));

    expect(writeText).toHaveBeenCalledWith(configText());
    expect(copyButton(container).textContent).toBe('Copied');
    expect(copyButton(container).getAttribute('leadingicon')).toBe('checkmark');
  });

  it('can show the copy button again after a while', async () => {
    writeText.mockResolvedValue(undefined);
    const { container } = renderInfo();

    await click(copyButton(container));
    act(() => {
      jest.advanceTimersByTime(COPIED_DISPLAY_MS);
    });

    expect(copyButton(container).textContent).toBe('Copy');
    expect(copyButton(container).getAttribute('leadingicon')).toBe('copy');
  });

  it('can show that copying failed', async () => {
    writeText.mockRejectedValue(new Error('denied'));
    const { container } = renderInfo();

    await click(copyButton(container));

    expect(copyButton(container).textContent).toBe('Copy failed');
    expect(copyButton(container).getAttribute('leadingicon')).toBe('warning');
  });

  it('can show the copy button again after copying failed', async () => {
    writeText.mockRejectedValue(new Error('denied'));
    const { container } = renderInfo();

    await click(copyButton(container));
    act(() => {
      jest.advanceTimersByTime(COPIED_DISPLAY_MS);
    });

    expect(copyButton(container).textContent).toBe('Copy');
    expect(copyButton(container).getAttribute('leadingicon')).toBe('copy');
  });

  it('can copy again after copying failed', async () => {
    writeText.mockRejectedValueOnce(new Error('denied')).mockResolvedValueOnce(undefined);
    const { container } = renderInfo();

    await click(copyButton(container));
    await click(copyButton(container));

    expect(copyButton(container).textContent).toBe('Copied');
  });

  it('does not double the slash when the token handler URL has a trailing slash', () => {
    renderInfo({ ...state, config: { serviceUrls: { tokenHandlerApiUrl: 'https://token-handler.example.ca//' } } });

    const text = configText();
    expect(text).toContain('proxy_pass https://token-handler.example.ca/token-handler/v1/;');
    expect(text).not.toContain('ca//token-handler');
  });

  it('describes the proxy requirement and links to the examples', () => {
    renderInfo();

    expect(screen.getByTestId('token-handler-proxy-info').textContent).toContain('session cookie');
    const link = screen.getByText('Proxy configuration examples').closest('a');
    expect(link.getAttribute('href')).toBe(
      'https://govalta.github.io/adsp-monorepo/services/token-handler.html#reverse-proxy',
    );
    expect(link.getAttribute('target')).toBe('_blank');
  });
});
