import React, { FunctionComponent, useState, useEffect } from 'react';

import type { FeedbackSite } from '@store/feedback/models';
import { fetchAllTags } from '@store/form/action';
import {
  GoabButton,
  GoabButtonGroup,
  GoabInput,
  GoabFormItem,
  GoabModal,
  GoabCheckbox,
  GoabFilterChip,
} from '@abgov/react-components';
import { GoADropdownOption, GoADropdown } from '@abgov/react-components-old';
import { fetchResourceTypeAction } from '@store/directory/actions';
import { RootState } from '@store/index';
import { useValidators } from '@lib/validation/useValidators';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import { showTaggingFeature } from '../overview';

import {
  isNotEmptyCheck,
  wordMaxLengthCheck,
  duplicateNameCheck,
  characterCheck,
  validationPattern,
} from '@lib/validation/checkInput';
import { CheckboxSpaceWrapper } from '../styled-components';
import { ChipsWrapper } from '../../events/stream/styleComponents';
import { HelpText } from '@components/styled-components';
import { GoabCheckboxOnChangeDetail, GoabInputOnChangeDetail } from '@abgov/ui-components-common';
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
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(fetchResourceTypeAction());
  }, [dispatch]);

  const removeSelectedTag = (eventChip) => {
    const updatedSelectedTags = selectedTags.filter((event) => event !== eventChip);
    setSelectedTags(updatedSelectedTags);
  };

  const indicator = useSelector((state: RootState) => {
    return state?.session?.indicator;
  });

  const NO_TAG_FILTER = {
    label: '<No tag filter>',
    value: '',
  };

  const tags = useSelector((state: RootState) => state.form.formResourceTag.tags || []);

  useEffect(() => {
    dispatch(fetchAllTags());
  }, [dispatch]);

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
      <GoabModal
        testId="add-site-modal"
        open={open}
        heading={isEdit ? 'Edit registered site' : 'Register site'}
        actions={
          <GoabButtonGroup alignment="end">
            <GoabButton
              testId="site-cancel"
              type="secondary"
              onClick={() => {
                onClose();
              }}
            >
              Cancel
            </GoabButton>

            {isEdit ? (
              <GoabButton
                type="primary"
                testId="site-edit"
                disabled={!site.url || validators.haveErrors()}
                onClick={() => {
                  onSave(site);
                  onClose();
                }}
              >
                Save
              </GoabButton>
            ) : (
              <GoabButton
                type="primary"
                testId="site-register"
                disabled={!site.url || validators.haveErrors()}
                onClick={() => {
                  onEdit(site);
                  onClose();
                }}
              >
                Register
              </GoabButton>
            )}
          </GoabButtonGroup>
        }
      >
        <div>
          <GoabFormItem
            label="Site URL"
            requirement="required"
            labelSize="regular"
            testId="feedback-url-formItem"
            error={errors?.['url'] || urlError}
          >
            <GoabInput
              type="text"
              name="url"
              value={site.url}
              width="100%"
              testId="feedback-url"
              aria-label="url"
              disabled={isEdit}
              onChange={(detail: GoabInputOnChangeDetail) => {
                validators.remove('url');
                validators['url'].check(detail.value);
                setSite({ ...site, url: detail.value });
              }}
              onBlur={() => {
                validators.checkAll({ url: site.url });
                setUrlError(errors?.['url'] || '');
              }}
            />
          </GoabFormItem>
          {showTaggingFeature && (
            <div className="mt-1">
              <GoabFormItem label="Add tag(s)">
                <GoADropdown
                  name="TagFilter"
                  selectedValues={site.tags}
                  multiSelect={true}
                  disabled={false}
                  onChange={(_, value) => {
                    setSite({ ...site, tags: value });
                  }}
                >
                  <GoADropdownOption value={NO_TAG_FILTER.value} label={NO_TAG_FILTER.label} />
                  {tags
                    .sort((a, b) => a.label.localeCompare(b.label))
                    .map((tag) => (
                      <GoADropdownOption key={tag.urn} value={tag.value} label={tag.label} />
                    ))}
                </GoADropdown>
                <div className="mt-1">
                  <ChipsWrapper>
                    {(site.tags || []).map((tagChip) => {
                      return (
                        <div className="mr-1">
                          <GoabFilterChip key={tagChip} content={tagChip} onClick={() => removeSelectedTag(tagChip)} />
                        </div>
                      );
                    })}
                  </ChipsWrapper>
                </div>
              </GoabFormItem>
            </div>
          )}

          <CheckboxSpaceWrapper>
            <GoabCheckbox
              text={'Allow anonymous feedback'}
              testId="anonymous-feedback"
              ariaLabel="Anonymous feedback"
              onChange={(detail: GoabCheckboxOnChangeDetail) => {
                setSite({ ...site, allowAnonymous: detail.checked });
              }}
              name={'isAnonymous'}
              checked={site.allowAnonymous ?? false}
            />
          </CheckboxSpaceWrapper>
          <HelpText>
            <div>Enabling anonymous feedback may result in lower quality feedback.</div>
          </HelpText>
        </div>
      </GoabModal>
    </ModalOverwrite>
  );
};

const ModalOverwrite = styled.div`
  .modal {
    max-height: 100% !important;
  }

  .mt-1 {
    margin-top: 1rem;
  }

  .mr-1 {
    margin-right: 0.5rem;
  }

  ul {
    padding-left: 0;
  }
`;
