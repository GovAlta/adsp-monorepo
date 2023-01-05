import React, { FC, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { saveApplication } from '@store/status/actions';
import { fetchDirectory, fetchDirectoryDetailByURNs } from '@store/directory/actions';
import { ApplicationStatus } from '@store/status/models';
import { GoAButton, GoADropdownOption } from '@abgov/react-components';
import { useValidators } from '@lib/useValidators';
import { characterCheck, validationPattern, isNotEmptyCheck, Validator } from '@lib/checkInput';

import {
  GoAForm,
  GoAFormItem,
  GoAInput,
  GoAModal,
  GoAModalActions,
  GoAModalContent,
  GoAModalTitle,
} from '@abgov/react-components/experimental';
import { RootState } from '@store/index';
import { createSelector } from 'reselect';
import { DropdownListContainer, DropdownList, IdField } from './styled-components';
import { toKebabName } from '@lib/kebabName';

interface Props {
  isOpen: boolean;
  title: string;
  testId: string;
  isEdit: boolean;
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
  isEdit,
}: Props) => {
  const dispatch = useDispatch();
  const [application, setApplication] = useState<ApplicationStatus>({ ...defaultApplication });
  const tenantServiceUrns = useSelector(tenantServiceURNSelector);
  const healthEndpoints = useSelector(healthEndpointsSelector);
  const [openDropdown, setOpenDropdown] = useState<boolean>(false);
  const { directory } = useSelector((state: RootState) => state.directory);
  const { applications } = useSelector((state: RootState) => state.serviceStatus);
  const checkForBadChars = characterCheck(validationPattern.mixedArrowCaseWithSpace);

  const isDuplicateAppName = (): Validator => {
    return (appName: string) => {
      let existingApp = false;
      console.log('appName', appName);

      for (const application of applications) {
        existingApp = application.name === appName;
      }
      return existingApp ? 'application name is duplicate, please use a different name' : '';
    };
  };
  const isDuplicateAppKey = (): Validator => {
    return (appKey: string) => {
      let existingApp = false;
      console.log('appKey', appKey);
      for (const application of applications) {
        existingApp = application.appKey === appKey;
      }
      return existingApp ? 'application key is duplicate, please use a different name' : '';
    };
  };
  const { errors, validators } = useValidators(
    'name',
    'name',
    checkForBadChars,
    isNotEmptyCheck('name'),
    isDuplicateAppName()
  )
    .add('appKeyDuplicate', 'appKey', isDuplicateAppKey())
    .build();

  function save() {
    if (!isFormValid()) {
      return;
    }
    dispatch(saveApplication(application));
    if (onSave) onSave();
  }

  // const checkForBadChars = characterCheck(validationPattern.mixedArrowCaseWithSpace);
  // const wordLengthCheck = wordMaxLengthCheck(32);

  // const { errors, validators } = useValidators(
  //   'name',
  //   'name',
  //   checkForBadChars,
  //   wordLengthCheck,
  //   isNotEmptyCheck('name')
  // ).build();

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
          <GoAFormItem error={errors?.['name'] || errors?.['appKey']}>
            <label>Application name</label>
            <GoAInput
              type="text"
              name="name"
              value={application?.name}
              onChange={(name, value) => {
                console.log('errors', errors);

                // name should be unique
                validators['name'].check(value);
                if (!isEdit) {
                  // check for duplicate appKey
                  const appKey = toKebabName(value);
                  const validations = {
                    appKeyDuplicate: appKey,
                  };
                  validators.checkAll(validations);
                  setApplication({
                    ...application,
                    name: value,
                    appKey,
                  });
                } else {
                  // should not update appKey during update
                  setApplication({
                    ...application,
                    name: value,
                  });
                }
              }}
              aria-label="name"
            />
          </GoAFormItem>
          <GoAFormItem>
            <label>application ID</label>
            <IdField>{application.appKey}</IdField>
          </GoAFormItem>
          <GoAFormItem>
            <label>Description</label>
            <textarea
              name="description"
              className="goa-textarea"
              value={application?.description}
              onChange={(e) =>
                setApplication({
                  ...application,
                  description: e.target.value,
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

export default ApplicationFormModal;
