import React, { FunctionComponent, useState, useEffect } from 'react';

import type { FeedbackSite } from '@store/feedback/models';
import { GoAButton, GoAButtonGroup, GoAInput, GoAFormItem, GoAModal, GoACheckbox } from '@abgov/react-components';
import { useValidators } from '@lib/validation/useValidators';

import styled from 'styled-components';

import {
  isNotEmptyCheck,
  wordMaxLengthCheck,
  duplicateNameCheck,
  characterCheck,
  validationPattern,
} from '@lib/validation/checkInput';
import { CheckboxSpaceWrapper, HelpText } from '../styled-components';

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
    characterCheck(validationPattern.validURLOnlyDomain),
    isNotEmptyCheck('url'),
    duplicateNameCheck(allUrls, 'url')
  ).build();

  return (
    <ModalOverwrite>
      <GoAModal
        testId="add-site-modal"
        open={open}
        heading={isEdit ? 'Edit registered site' : 'Register site'}
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

            {isEdit ? (
              <GoAButton
                type="primary"
                testId="site-edit"
                disabled={!site.url || validators.haveErrors()}
                onClick={() => {
                  onSave(site);
                  onClose();
                }}
              >
                Save
              </GoAButton>
            ) : (
              <GoAButton
                type="primary"
                testId="site-register"
                disabled={!site.url || validators.haveErrors()}
                onClick={() => {
                  onEdit(site);
                  onClose();
                }}
              >
                Register
              </GoAButton>
            )}
          </GoAButtonGroup>
        }
      >
        <GoAFormItem
          label="Site URL"
          requirement="required"
          labelSize="regular"
          testId="feedback-url-formItem"
          error={errors?.['url'] || urlError}
        >
          <GoAInput
            type="text"
            name="url"
            value={site.url}
            width="100%"
            testId="feedback-url"
            aria-label="url"
            disabled={isEdit}
            onChange={(name, value) => {
              validators.remove('url');
              validators['url'].check(value);
              setSite({ ...site, url: value });
            }}
            onBlur={() => {
              validators.checkAll({ url: site.url });
              setUrlError(errors?.['url'] || '');
            }}
          />
        </GoAFormItem>
        <CheckboxSpaceWrapper>
          <GoACheckbox
            text={'Allow anonymous feedback'}
            testId="anonymous-feedback"
            ariaLabel="Anonymous feedback"
            onChange={(name, value) => {
              setSite({ ...site, allowAnonymous: value });
            }}
            name={'isAnonymous'}
            checked={site.allowAnonymous ?? false}
          />
        </CheckboxSpaceWrapper>
        <HelpText>
          <div>Enabling anonymous feedback may result in lower quality feedback.</div>
        </HelpText>
      </GoAModal>
    </ModalOverwrite>
  );
};

const ModalOverwrite = styled.div`
  .modal {
    max-height: 100% !important;
  }
`;
