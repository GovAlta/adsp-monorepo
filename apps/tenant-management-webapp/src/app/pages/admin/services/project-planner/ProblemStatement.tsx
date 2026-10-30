import React, { FunctionComponent, useEffect, useRef, useState } from 'react';
import {
  GoabButton,
  GoabFileUploadInput,
  GoabFormItem,
  GoabIcon,
  GoabTextArea,
  GoabTooltip,
} from '@abgov/react-components';
import type { GoabFileUploadInputOnSelectFileDetail } from '@abgov/ui-components-common';
import styled from 'styled-components';
import { usePlannerApi } from './api';

const UPLOAD_ACCEPT = '.md,.markdown,.doc,.docx,.pdf';
const UPLOAD_MAX_FILE_SIZE = '20MB';
const UPLOAD_HINT = 'Markdown (.md) is recommended. Word (.doc, .docx) and PDF (.pdf) are also supported.';

const UploadRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: var(--goa-space-l, 1.5rem);

  goa-file-upload-input {
    flex: 1 1 auto;
    min-width: 0;
    --goa-space-l: var(--goa-space-s, 0.75rem);
  }
`;

const UploadLabel = styled.span`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  flex: 0 0 auto;
  font-weight: var(--fw-bold, 700);
  white-space: nowrap;
`;

const UploadError = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: -0.75rem 0 var(--goa-space-l, 1.5rem);
  color: var(--goa-color-interactive-error, #ca0b00);
  font-size: var(--goa-font-size-3, 0.875rem);
`;

interface ProblemStatementProps {
  value: string;
  busy: boolean;
  continueLabel?: string;
  showContinue?: boolean;
  showUpload?: boolean;
  onChange: (value: string) => void;
  onContinue: () => void;
}

interface ProblemStatementUploadProps {
  onChange: (value: string) => void;
  disabled?: boolean;
}

export const ProblemStatementUpload: FunctionComponent<ProblemStatementUploadProps> = ({
  onChange,
  disabled = false,
}) => {
  const api = usePlannerApi();
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const uploadRowRef = useRef<HTMLDivElement>(null);
  const shadowRootRef = useRef<ShadowRoot | null>(null);
  const blocked = disabled || uploading;
  const blockedRef = useRef(blocked);
  blockedRef.current = blocked;

  const applyDisabled = (root: ShadowRoot) => {
    const button = root.querySelector('goa-button');
    if (blockedRef.current) {
      button?.setAttribute('disabled', 'disabled');
    } else {
      button?.removeAttribute('disabled');
    }
  };

  useEffect(() => {
    let cancelled = false;
    let frame: number;
    let observer: MutationObserver | undefined;

    const hideMaxFileSize = (root: ShadowRoot) => {
      const hint = root.querySelector<HTMLElement>('[data-testid="max-file-size"]');
      if (hint) {
        hint.style.display = 'none';
      }
    };

    const compactChooseFileButton = (root: ShadowRoot) => {
      root.querySelector('goa-button')?.setAttribute('size', 'compact');
    };

    const captureIssue = (root: ShadowRoot) => {
      const card = root.querySelector('goa-file-upload-card') as (Element & { error?: string }) | null;
      const issues = root.querySelector<HTMLElement>('.issues');
      if (card && issues) {
        issues.style.display = 'none';
        const error = card.getAttribute('error') || card.error || 'This file type is not supported.';
        setUploadError(`${error} Please reupload a valid file.`);
      } else {
        setUploadError(null);
      }
    };

    const attach = () => {
      if (cancelled) {
        return;
      }
      const root = uploadRowRef.current?.querySelector('goa-file-upload-input')?.shadowRoot;
      if (!root) {
        frame = requestAnimationFrame(attach);
        return;
      }
      shadowRootRef.current = root;
      hideMaxFileSize(root);
      compactChooseFileButton(root);
      captureIssue(root);
      applyDisabled(root);
      observer = new MutationObserver(() => {
        hideMaxFileSize(root);
        compactChooseFileButton(root);
        captureIssue(root);
        applyDisabled(root);
      });
      observer.observe(root, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['error', 'filename'],
      });
    };

    attach();

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      observer?.disconnect();
    };
  }, []);

  useEffect(() => {
    if (shadowRootRef.current) {
      applyDisabled(shadowRootRef.current);
    }
  }, [blocked]);

  const uploadFile = async (detail: GoabFileUploadInputOnSelectFileDetail) => {
    setUploading(true);
    setUploadError(null);
    const extracted = await api.extractProblemStatement(detail.file).catch(() => undefined);
    if (extracted) {
      onChange(extracted.text);
    }
    setUploading(false);
  };

  return (
    <div>
      <UploadRow ref={uploadRowRef}>
        <UploadLabel>
          Or upload a file
          <GoabTooltip content={UPLOAD_HINT} position="top">
            <GoabIcon type="help-circle" ariaLabel="Upload file requirements" />
          </GoabTooltip>
        </UploadLabel>
        <GoabFileUploadInput
          variant="button"
          accept={UPLOAD_ACCEPT}
          maxFileSize={UPLOAD_MAX_FILE_SIZE}
          testId="problem-statement-upload"
          onSelectFile={uploadFile}
        />
        {uploading && (
          <span data-testid="problem-statement-uploading" style={{ fontSize: '85%' }}>
            Uploading…
          </span>
        )}
      </UploadRow>
      {uploadError && (
        <UploadError data-testid="problem-statement-upload-error">
          <GoabIcon type="warning" size="small" theme="filled" ariaLabel="Upload error" />
          <span>{uploadError}</span>
        </UploadError>
      )}
    </div>
  );
};

export const ProblemStatement: FunctionComponent<ProblemStatementProps> = ({
  value,
  busy,
  continueLabel = 'Continue',
  showContinue = true,
  showUpload = true,
  onChange,
  onContinue,
}) => {
  return (
    <div data-testid="problem-statement">
      <GoabFormItem label="Describe the problem" maxWidth="100%" mb="m">
        <GoabTextArea
          name="problemStatement"
          value={value}
          rows={5}
          width="100%"
          maxWidth="100%"
          testId="problem-input"
          disabled={busy}
          placeholder="Describe who uses the service, the steps they take, the decisions made, and any documents or notifications involved."
          onChange={(detail) => onChange(detail.value)}
        />
      </GoabFormItem>
      {showUpload && <ProblemStatementUpload onChange={onChange} />}
      {showContinue && (
        <GoabButton type="primary" testId="problem-continue" disabled={busy || !value.trim()} onClick={onContinue}>
          {continueLabel}
        </GoabButton>
      )}
    </div>
  );
};

export default ProblemStatement;
