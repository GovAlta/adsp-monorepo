import React, { FC, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { saveApplication } from '@store/status/actions';
import { fetchDirectory, fetchDirectoryDetailByURNs } from '@store/directory/actions';
import { ApplicationStatus } from '@store/status/models';
import { GoAButton, GoAButtonGroup, GoAInput, GoATextArea, GoAFormItem, GoAModal } from '@abgov/react-components-new';
import { useValidators } from '@lib/validation/useValidators';
import { GoADropdownOption } from '@abgov/react-components';

import {
  characterCheck,
  validationPattern,
  isNotEmptyCheck,
  Validator,
  wordMaxLengthCheck,
  duplicateNameCheck,
} from '@lib/validation/checkInput';

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
  (state: RootState) => state.directory?.directory,
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
  (state: RootState) => state.directory?.directory,
  (directory) => {
    return directory
      .filter((_directory) => {
        return _directory?.metadata?._links?.health?.href !== undefined;
      })
      .map((_directory) => {
        return _directory?.metadata._links?.health?.href;
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
  const { directory } = useSelector((state: RootState) => state.directory);
  const { applications } = useSelector((state: RootState) => state.serviceStatus);
  const checkForBadChars = characterCheck(validationPattern.mixedArrowCaseWithSpace);
  const [openDropdown, setOpenDropdown] = useState<boolean>(false);

  const isDuplicateAppName = (): Validator => {
    return (appName: string) => {
      const existingApp = applications.filter((app) => app.name === appName);

      return existingApp.length === 1 ? 'application name is duplicate, please use a different name' : '';
    };
  };
  const isDuplicateAppKey = (): Validator => {
    return (appKey: string) => {
      const existingApp = applications.filter((app) => app.appKey === appKey);
      return existingApp.length === 1 ? 'application key is duplicate, please use a different name' : '';
    };
  };

  const { errors, validators } = useValidators(
    'nameAppKey',
    'name',
    checkForBadChars,
    wordMaxLengthCheck(32, 'Name'),
    isNotEmptyCheck('nameAppKey'),
    isDuplicateAppKey()
  )
    .add('nameOnly', 'name', checkForBadChars, isDuplicateAppName())
    .add(
      'duplicated',
      'name',
      duplicateNameCheck(
        applications.map((app) => app.name),
        'Application'
      )
    )
    .add('description', 'description', wordMaxLengthCheck(250, 'Description'))
    .add(
      'url',
      'url',
      wordMaxLengthCheck(150, 'URL'),
      characterCheck(validationPattern.validURL),
      isNotEmptyCheck('url')
    )
    .build();

  function save() {
    if (!isFormValid()) {
      return;
    }

    application.status = 'operational';
    dispatch(saveApplication(application));
    if (onSave) onSave();
    validators.clear();
    setApplication({ ...defaultApplication });
  }

  function isFormValid(): boolean {
    if (!application?.name) return false;
    if (!application?.endpoint.url) return false;
    return !validators.haveErrors();
  }

  useEffect(() => {
    if (directory.length === 0) {
      dispatch(fetchDirectory());
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    dispatch(fetchDirectoryDetailByURNs(tenantServiceUrns));
  }, [tenantServiceUrns.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // eslint-disable-next-line
  // useEffect(() => {}, [healthEndpoints]);

  return (
    <GoAModal
      open={isOpen}
      testId={testId}
      heading={title}
      actions={
        <GoAButtonGroup alignment="end">
          <GoAButton
            type="secondary"
            testId="form-cancel-button"
            onClick={() => {
              if (onCancel) onCancel();
              validators.clear();
              setApplication({ ...defaultApplication });
            }}
          >
            Cancel
          </GoAButton>
          <GoAButton
            testId="form-save-button"
            disabled={!isFormValid() || validators.haveErrors()}
            type="primary"
            onClick={save}
          >
            Save
          </GoAButton>
        </GoAButtonGroup>
      }
    >
      <GoAFormItem error={errors?.['duplicated'] || errors?.['name']} label="Application name">
        <GoAInput
          type="text"
          name="name"
          width="100%"
          testId="application-name-input"
          value={application?.name}
          onChange={(name, value) => {
            if (!isEdit) {
              const appKey = toKebabName(value);
              validators.remove('nameAppKey');
              validators['nameAppKey'].check(appKey);
              validators.remove('duplicated');
              validators['duplicated'].check(value);
              setApplication({
                ...application,
                name: value,
                appKey,
              });
            } else {
              validators.remove('nameOnly');
              validators['nameOnly'].check(value);
              validators.remove('duplicated');
              validators['duplicated'].check(value);
              setApplication({
                ...application,
                name: value,
              });
            }
          }}
          onBlur={() => {
            if (!isEdit) {
              validators.checkAll({ nameAppKey: application?.appKey });
            } else {
              validators.checkAll({ nameOnly: application?.name });
            }
          }}
          aria-label="name"
        />
      </GoAFormItem>
      <GoAFormItem label="Application ID">
        <IdField>{application.appKey}</IdField>
      </GoAFormItem>
      <GoAFormItem error={errors?.['description']} label="Description">
        <GoATextArea
          name="description"
          width="100%"
          value={application?.description}
          testId="application-description"
          onChange={(name, value) => {
            validators.remove('description');
            validators['description'].check(value);
            setApplication({
              ...application,
              description: value,
            });
          }}
          aria-label="description"
        />
      </GoAFormItem>
      <GoAFormItem error={errors?.['url']} label="URL">
        <GoAInput
          type="url"
          name="url"
          width="100%"
          value={application?.endpoint?.url}
          aria-label="input-url"
          testId="application-url-input"
          onChange={(name, value) => {
            validators.remove('url');
            validators['url'].check(value);
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
                    aria-label="select-dropdown-url"
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
    </GoAModal>
  );
};

export default ApplicationFormModal;
