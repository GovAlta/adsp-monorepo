import { GoabButton, GoabButtonGroup, GoabFormItem, GoabModal, GoabInput, GoabTextArea } from '@abgov/react-components';
import { FunctionComponent, useEffect, useState } from 'react';
import { GoabInputOnChangeDetail, GoabTextAreaOnChangeDetail } from '@abgov/ui-components-common';
import { McpServerConfiguration } from '@store/agent/model';

interface AddEditMcpServerModalProps {
  server: McpServerConfiguration | null;
  existingServerUrls?: string[];
  editingServerUrl?: string;
  open: boolean;
  onCancel: () => void;
  onOK: (server: McpServerConfiguration) => void;
}

const defaultServer: McpServerConfiguration = {
  url: '',
  headers: {},
  capabilities: [],
};

export const AddEditMcpServerModal: FunctionComponent<AddEditMcpServerModalProps> = ({
  server: initialValue,
  existingServerUrls = [],
  editingServerUrl,
  open,
  onCancel,
  onOK,
}) => {
  const [server, setServer] = useState<McpServerConfiguration>(defaultServer);
  const [headersText, setHeadersText] = useState('{}');
  const [capabilitiesText, setCapabilitiesText] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const value = initialValue || defaultServer;
    setServer(value);
    setHeadersText(JSON.stringify(value.headers || {}, null, 2));
    setCapabilitiesText((value.capabilities || []).join(', '));
    setErrors({});
  }, [initialValue, open]);

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    const trimmedUrl = server.url?.trim();

    if (!trimmedUrl) {
      nextErrors.url = 'URL is required.';
    } else {
      try {
        const normalizedUrl = new URL(trimmedUrl);
        const normalized = `${normalizedUrl.protocol.toLowerCase()}//${normalizedUrl.hostname.toLowerCase()}${
          normalizedUrl.port ? `:${normalizedUrl.port}` : ''
        }${(normalizedUrl.pathname.replace(/\/+$/g, '') || '/').replace(/\/+/g, '/')}`;
        const normalizedEditingUrl = editingServerUrl
          ? `${new URL(editingServerUrl).protocol.toLowerCase()}//${new URL(editingServerUrl).hostname.toLowerCase()}${
              new URL(editingServerUrl).port ? `:${new URL(editingServerUrl).port}` : ''
            }${(new URL(editingServerUrl).pathname.replace(/\/+$/g, '') || '/').replace(/\/+/g, '/')}`
          : null;
        const hasDuplicate = existingServerUrls.some((existing) => {
          try {
            const parsed = new URL(existing);
            const normalizedExisting = `${parsed.protocol.toLowerCase()}//${parsed.hostname.toLowerCase()}${
              parsed.port ? `:${parsed.port}` : ''
            }${(parsed.pathname.replace(/\/+$/g, '') || '/').replace(/\/+/g, '/')}`;
            return normalizedExisting === normalized && normalizedExisting !== normalizedEditingUrl;
          } catch {
            return false;
          }
        });
        if (hasDuplicate) {
          nextErrors.url = 'Duplicate MCP server URL is not supported for a single agent.';
        }
      } catch {
        nextErrors.url = 'URL must be a valid absolute URL.';
      }
    }

    let headers: Record<string, string> = {};
    if (headersText.trim()) {
      try {
        const parsed = JSON.parse(headersText);
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
          nextErrors.headers = 'Headers must be a JSON object of string values.';
        } else {
          const hasInvalidValue = Object.values(parsed).some((value) => typeof value !== 'string');
          if (hasInvalidValue) {
            nextErrors.headers = 'Headers must be a JSON object of string values.';
          } else {
            headers = parsed as Record<string, string>;
          }
        }
      } catch {
        nextErrors.headers = 'Headers must be valid JSON.';
      }
    }

    const capabilityValues = capabilitiesText
      .split(/[\n,]/)
      .map((value) => value.trim())
      .filter((value) => !!value);
    const duplicateCapability = capabilityValues.find((value, index, values) => values.indexOf(value) !== index);
    if (duplicateCapability) {
      nextErrors.capabilities = `Duplicate capability '${duplicateCapability}' found.`;
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const capabilities = capabilityValues;

    onOK({
      url: trimmedUrl,
      headers,
      capabilities,
    });
  };

  return (
    <GoabModal
      testId="add-edit-mcp-server-modal"
      open={open}
      heading={`${initialValue?.url ? 'Edit' : 'Add'} MCP server`}
      actions={
        <GoabButtonGroup alignment="end">
          <GoabButton type="secondary" testId="mcp-server-modal-cancel" onClick={onCancel}>
            Cancel
          </GoabButton>
          <GoabButton type="primary" testId="mcp-server-modal-save" onClick={validate}>
            OK
          </GoabButton>
        </GoabButtonGroup>
      }
    >
      <form>
        <GoabFormItem label="Server URL" mb="m" error={errors.url}>
          <GoabInput
            name="mcp-server-url"
            value={server.url}
            width="100%"
            onChange={(detail: GoabInputOnChangeDetail) => setServer({ ...server, url: detail.value })}
          />
        </GoabFormItem>

        <GoabFormItem label="Headers (JSON object)" mb="m" error={errors.headers}>
          <GoabTextArea
            name="mcp-server-headers"
            value={headersText}
            width="100%"
            onChange={(detail: GoabTextAreaOnChangeDetail) => setHeadersText(detail.value)}
          />
        </GoabFormItem>

        <GoabFormItem label="Capabilities (comma or newline separated)" mb="none" error={errors.capabilities}>
          <GoabTextArea
            name="mcp-server-capabilities"
            value={capabilitiesText}
            width="100%"
            onChange={(detail: GoabTextAreaOnChangeDetail) => setCapabilitiesText(detail.value)}
          />
        </GoabFormItem>
      </form>
    </GoabModal>
  );
};
