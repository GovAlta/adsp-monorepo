import React, { FunctionComponent, useState, useEffect } from 'react';

import type { FeedbackSite } from '@store/feedback/models';
import { fetchAllTags } from '@store/form/action';
import {
  GoAButton,
  GoAButtonGroup,
  GoAInput,
  GoAFormItem,
  GoAModal,
  GoACheckbox,
  GoAFilterChip,
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
import { CheckboxSpaceWrapper, HelpText } from '../styled-components';
import { ChipsWrapper } from '../../events/stream/styleComponents';

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
        <div>
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
          {showTaggingFeature && (
            <div className="mt-1">
              <GoAFormItem label="Add tag(s)">
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
                          <GoAFilterChip key={tagChip} content={tagChip} onClick={() => removeSelectedTag(tagChip)} />
                        </div>
                      );
                    })}
                  </ChipsWrapper>
                </div>
              </GoAFormItem>
            </div>
          )}

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
        </div>
      </GoAModal>
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
