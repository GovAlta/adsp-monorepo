import React, { FunctionComponent, useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import type { FeedbackSite } from '@store/feedback/models';
import {
  GoAButton,
  GoAButtonGroup,
  GoAInput,
  GoAFormItem,
  GoAModal,
  GoATextArea,
  GoADropdown,
  GoADropdownItem,
  GoACheckbox,
} from '@abgov/react-components-new';
import { useValidators } from '@lib/validation/useValidators';
import { useDispatch } from 'react-redux';
import { DropdownWrapper, UrlWrapper } from './styled-components';
import styled from 'styled-components';
import { toKebabName } from '@lib/kebabName';
import {
  isNotEmptyCheck,
  wordMaxLengthCheck,
  badCharsCheck,
  duplicateNameCheck,
  Validator,
  characterCheck,
  validationPattern,
} from '@lib/validation/checkInput';

interface SiteFormProps {
  initialValue?: FeedbackSite;
  sites: FeedbackSite[];
  onClose?: () => void;
  onSave?: (site: FeedbackSite) => void;
  onEdit?: (site: FeedbackSite) => void;
  open: boolean;
  isEdit: boolean;
}

export const SiteAddEditForm: FunctionComponent<SiteFormProps> = ({
  initialValue,
  onClose,
  open,
  isEdit,
  sites,
  onSave,
  onEdit,
}) => {
  const [site, setSite] = useState<FeedbackSite>(initialValue);
  const [urlError, setUrlError] = useState<string>('');

  useEffect(() => {
    setSite(initialValue);
  }, [initialValue]);
  const allUrls = sites && sites.length > 0 ? sites.map((u) => u.url) : [];
  const { errors, validators } = useValidators(
    'url',
    'url',
    wordMaxLengthCheck(150, 'URL'),
    characterCheck(validationPattern.validURL),
    isNotEmptyCheck('url'),
    duplicateNameCheck(allUrls, 'url')
  ).build();

  return (
    <ModalOverwrite>
      <GoAModal
        testId="add-site-modal"
        open={open}
        heading={isEdit ? 'Edit site' : 'Add site'}
        actions={
          <GoAButtonGroup alignment="end">
            <GoAButton
              testId="site-cancel"
              type="secondary"
              onClick={() => {
                onClose();
              }}
            >
              Cancel
            </GoAButton>
            <GoAButton
              type="primary"
              testId="site-save"
              disabled={!site.url || validators.haveErrors()}
              onClick={() => {
                const validations = {};

                if (isEdit) {
                  onSave(site);
                } else {
                  onEdit(site);
                }
                onClose();
              }}
            >
              Save
            </GoAButton>
          </GoAButtonGroup>
        }
      >
        <GoAFormItem
          label="URL of the Site"
          requirement="required"
          labelSize="regular"
          testId="feedback-url-formitem"
          error={errors?.['url'] || urlError}
        >
          <GoAInput
            type="text"
            name="url"
            value={site.url}
            testId="feedback-url"
            aria-label="url"
            disabled={isEdit}
            onChange={(name, value) => {
              validators.remove('url');
              validators['url'].check(value);
              setSite({ ...site, url: value });
            }}
          />
        </GoAFormItem>
        <GoAFormItem
          label="Anonymous feedback"
          labelSize="regular"
          helpText="enabling anonymous feedback may result in lower quality feedback."
        >
          <GoACheckbox
            text="Allow"
            testId="anonymous-feedback"
            ariaLabel="Anonymous feedback"
            onChange={(name, value) => {
              setSite({ ...site, allowAnonymous: value });
            }}
            name={'isAnonymous'}
            value={site.allowAnonymous}
            checked={site.allowAnonymous}
          ></GoACheckbox>
        </GoAFormItem>
      </GoAModal>
    </ModalOverwrite>
  );
};

const ModalOverwrite = styled.div`
  .modal {
    max-height: 100% !important;
  }
`;
