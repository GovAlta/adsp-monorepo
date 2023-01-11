import React, { FC, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { saveApplication } from '@store/status/actions';
import { fetchDirectory, fetchDirectoryDetailByURNs } from '@store/directory/actions';
import { ApplicationStatus } from '@store/status/models';
import { GoAButton, GoADropdownOption } from '@abgov/react-components';
import {
  GoAForm,
  GoAFormItem,
  GoAInput,
  GoAModal,
  GoAModalActions,
  GoAModalContent,
  GoAModalTitle,
} from '@abgov/react-components/experimental';
import { GoATextArea } from '@abgov/react-components-new';
import { RootState } from '@store/index';
import { createSelector } from 'reselect';
import { useValidators } from '@lib/useValidators';
import { characterCheck, validationPattern, isNotEmptyCheck, wordMaxLengthCheck } from '@lib/checkInput';
import styled from 'styled-components';

interface Props {
  isOpen: boolean;
  title: string;
  testId: string;
  defaultApplication: ApplicationStatus;
  onCancel?: () => void;
  onSave?: () => void;
}
const tenantServiceURNSelector = createSelector(
  (state: RootState) => state.directory.directory,
  (directory) => {
    if (!directory) {
      return [];
    }
    return Object.entries(directory)
      .filter((_directory) => {
        return _directory[1].isCore === false;
      })
      .map((_directory) => {
        return _directory[1].urn;
      });
  }
);

const healthEndpointsSelector = createSelector(
  (state: RootState) => state.directory.directory,
  (directory) => {
    return directory
      .filter((_directory) => {
        return _directory?.metadata?._links?.health?.href !== undefined;
      })
      .map((_directory) => {
        return _directory?.metadata._links.health.href;
      });
  }
);

export const ApplicationFormModal: FC<Props> = ({
  isOpen,
  title,
  onCancel,
  onSave,
  testId,
  defaultApplication,
}: Props) => {
  const dispatch = useDispatch();
  const [application, setApplication] = useState<ApplicationStatus>({ ...defaultApplication });
  const tenantServiceUrns = useSelector(tenantServiceURNSelector);
  const healthEndpoints = useSelector(healthEndpointsSelector);
  const [openDropdown, setOpenDropdown] = useState<boolean>(false);
  const { directory } = useSelector((state: RootState) => state.directory);

  function save() {
    if (!isFormValid()) {
      return;
    }
    dispatch(saveApplication(application));
    if (onSave) onSave();
  }

  const checkForBadChars = characterCheck(validationPattern.mixedArrowCaseWithSpace);
  const wordLengthCheck = wordMaxLengthCheck(32);

  const { errors, validators } = useValidators(
    'name',
    'name',
    checkForBadChars,
    wordLengthCheck,
    isNotEmptyCheck('name')
  ).build();

  function isFormValid(): boolean {
    if (!application?.name) return false;
    if (!application?.endpoint.url) return false;
    return !validators.haveErrors();
  }

  useEffect(() => {
    if (directory.length === 0) {
      dispatch(fetchDirectory());
    }
  }, []);

  useEffect(() => {
    dispatch(fetchDirectoryDetailByURNs(tenantServiceUrns));
  }, [tenantServiceUrns.length]);

  // eslint-disable-next-line
  useEffect(() => {}, [healthEndpoints]);

  return (
    <GoAModal isOpen={isOpen} testId={testId}>
      <GoAModalTitle>{title}</GoAModalTitle>
      <GoAModalContent>
        <GoAForm>
          <GoAFormItem error={errors?.['name']}>
            <label>Application name</label>

            <GoAInput
              type="text"
              name="name"
              value={application?.name}
              onChange={(name, value) => {
                validators['name'].check(value);

                setApplication({
                  ...application,
                  name: value,
                });
              }}
              aria-label="name"
            />
          </GoAFormItem>

          <GoAFormItem>
            <label>Description</label>
            <GoATextArea
              name="description"
              width="100%"
              value={application?.description}
              onChange={(name, value) =>
                setApplication({
                  ...application,
                  description: value,
                })
              }
              aria-label="description"
            />
          </GoAFormItem>
          <GoAFormItem>
            <label>URL</label>
            <GoAInput
              type="test"
              name="url"
              value={application?.endpoint?.url}
              onChange={(name, value) => {
                setApplication({
                  ...application,
                  endpoint: {
                    url: value,
                    status: 'offline',
                  },
                });
              }}
              onTrailingIconClick={() => {
                setOpenDropdown(!openDropdown);
              }}
              trailingIcon={openDropdown ? 'close-circle' : 'chevron-down'}
            />

            {openDropdown && (
              <DropdownListContainer>
                <DropdownList>
                  {healthEndpoints.map((endpoint): JSX.Element => {
                    return (
                      <GoADropdownOption
                        label={endpoint}
                        value={endpoint}
                        key={endpoint}
                        visible={true}
                        onClick={(value) => {
                          setApplication({
                            ...application,
                            endpoint: {
                              url: value,
                              status: 'offline',
                            },
                          });
                        }}
                      />
                    );
                  })}
                </DropdownList>
              </DropdownListContainer>
            )}
          </GoAFormItem>
        </GoAForm>
      </GoAModalContent>
      <GoAModalActions>
        <GoAButton
          buttonType="secondary"
          onClick={() => {
            if (onCancel) onCancel();
          }}
        >
          Cancel
        </GoAButton>
        <GoAButton disabled={!isFormValid()} buttonType="primary" onClick={save}>
          Save
        </GoAButton>
      </GoAModalActions>
    </GoAModal>
  );
};
const DropdownListContainer = styled.div`
  max-height: 10rem;
  overflow: hidden auto;
  padding: 0rem;
  scroll-behavior: smooth;
`;

const DropdownList = styled.ul`
  position: relative;
  margin-top: 3px;
  list-style-type: none;
  background: var(--color-white);
  border-radius: var(--input-border-radius);
  box-shadow: 0 8px 8px rgb(0 0 0 / 20%), 0 4px 4px rgb(0 0 0 / 10%);
  z-index: 99;
  padding-left: 0rem !important;
`;

export default ApplicationFormModal;
