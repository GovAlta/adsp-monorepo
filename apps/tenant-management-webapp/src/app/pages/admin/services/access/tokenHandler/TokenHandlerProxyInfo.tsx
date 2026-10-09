import React, { FunctionComponent, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { GoabButton } from '@abgov/react-components';
import styled from 'styled-components';
import { COPIED_DISPLAY_MS } from '@components/CopyLink/CopyLinkIcon';
import { ExternalLink } from '@components/icons/ExternalLink';
import { RootState } from '@store/index';
import { selectTenantName } from '@store/session/selectors';
import { createNginxConfig } from './proxyConfig';

interface Props {
  clientId: string;
  targetIds: string[];
}

/**
 * What the application needs to proxy to the token handler for a client, as nginx configuration.
 */
export const TokenHandlerProxyInfo: FunctionComponent<Props> = ({ clientId, targetIds }) => {
  const tokenHandlerUrl = useSelector((state: RootState) => state.config.serviceUrls?.tokenHandlerApiUrl);
  const tenantName = useSelector(selectTenantName);
  const [copyResult, setCopyResult] = useState<'copied' | 'failed' | null>(null);

  // A trailing slash on the URL would double up with the path.
  const base = `${(tokenHandlerUrl || '<token handler URL>').replace(/\/+$/, '')}/token-handler/v1`;
  const config = createNginxConfig({
    base,
    clientId,
    tenantName: tenantName || '<tenant name>',
    targetIds,
  });

  useEffect(() => {
    if (!copyResult) return;
    const timer = setTimeout(() => setCopyResult(null), COPIED_DISPLAY_MS);
    return () => clearTimeout(timer);
  }, [copyResult]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(config);
      setCopyResult('copied');
    } catch {
      // The clipboard is not available in all contexts, and the configuration can still be selected.
      setCopyResult('failed');
    }
  };

  return (
    <Section data-testid="token-handler-proxy-info">
      <h3>Proxy requirements</h3>
      <p>
        The application's web server must proxy requests to the token handler from the application's own domain, so that
        the session cookie is set for the application's site. Add this nginx location to the server, or use it as a
        guide for another server or the dev server proxy used for local development.{' '}
        <ExternalLink
          link="https://govalta.github.io/adsp-monorepo/services/token-handler.html#reverse-proxy"
          text="Proxy configuration examples"
          testId="token-handler-proxy-docs-link"
        />
      </p>
      <ConfigHeader>
        <span>nginx configuration</span>
        <GoabButton
          type="secondary"
          size="compact"
          leadingIcon={copyResult === 'copied' ? 'checkmark' : copyResult === 'failed' ? 'warning' : 'copy'}
          onClick={copy}
          testId="copy-nginx-config-btn"
        >
          {copyResult === 'copied' ? 'Copied' : copyResult === 'failed' ? 'Copy failed' : 'Copy'}
        </GoabButton>
      </ConfigHeader>
      <CodeBlock tabIndex={0} aria-label="nginx configuration" data-testid="nginx-config">
        {config}
      </CodeBlock>
    </Section>
  );
};

const Section = styled.section`
  margin-top: var(--goa-space-xl);

  h3 {
    margin: 0 0 var(--goa-space-s);
  }

  p {
    margin: 0 0 var(--goa-space-m);
  }
`;

const ConfigHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--goa-space-s);
`;

const CodeBlock = styled.pre`
  margin: 0;
  padding: var(--goa-space-m);
  overflow-x: auto;
  font-family: monospace;
  font-size: 0.875rem;
  line-height: 1.4;
  background: var(--goa-color-greyscale-100);
  border: 1px solid var(--goa-color-greyscale-200);
  border-radius: var(--goa-border-radius-m);
`;
