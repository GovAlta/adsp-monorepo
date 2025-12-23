import React, { FC, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { saveApplication } from '@store/status/actions';
import { fetchDirectory, fetchDirectoryDetailByURNs } from '@store/directory/actions';
import { ApplicationStatus } from '@store/status/models';
import { GoabButton, GoabButtonGroup, GoabInput, GoabTextArea, GoabFormItem, GoabModal } from '@abgov/react-components';
import { useValidators } from '@lib/validation/useValidators';
import { GoADropdownOption } from '@abgov/react-components-old';

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
import { HelpTextComponent } from '@components/HelpTextComponent';
import { GoabTextAreaOnChangeDetail, GoabInputOnChangeDetail } from '@abgov/ui-components-common';

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
  const [appName, setAppName] = useState('');
  const [appDescription, setAppDescription] = useState('');
  const descErrMessage = 'Application description can not be over 180 characters';
  const isDuplicateAppName = (): Validator => {
    return (appName: string) => {
      const existingApp = applications.filter((app) => app.name === appName);

      return existingApp.length === 1 && !(isEdit && existingApp[0]?.name === defaultApplication.name)
        ? 'application name is duplicate, please use a different name'
        : '';
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
    <GoabModal
      open={isOpen}
      testId={testId}
      heading={title}
      actions={
        <GoabButtonGroup alignment="end">
          <GoabButton
            type="secondary"
            testId="form-cancel-button"
            onClick={() => {
              if (onCancel) onCancel();
              validators.clear();
              setApplication({ ...defaultApplication });
              setAppName(defaultApplication?.name);
              setAppDescription(defaultApplication?.description);
            }}
          >
            Cancel
          </GoabButton>
          <GoabButton
            testId="form-save-button"
            disabled={!isFormValid() || validators.haveErrors()}
            type="primary"
            onClick={save}
          >
            Save
          </GoabButton>
        </GoabButtonGroup>
      }
    >
      <GoabFormItem error={errors?.['duplicated'] || errors?.['name']} label="Application name">
        <GoabInput
          type="text"
          name="name"
          width="100%"
          testId="application-name-input"
          value={appName ? appName : application?.name}
          onChange={(detail: GoabInputOnChangeDetail) => {
            if (!isEdit) {
              const appKey = toKebabName(detail.value);
              validators.remove('nameAppKey');
              validators['nameAppKey'].check(appKey);
              validators.remove('duplicated');
              validators['duplicated'].check(detail.value);
              setApplication({
                ...application,
                name: detail.value,
                appKey,
              });
            } else {
              validators.remove('nameOnly');
              validators['nameOnly'].check(detail.value);

              setApplication({
                ...application,
                name: detail.value,
              });
              setAppName(detail.value);
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
      </GoabFormItem>
      <GoabFormItem label="Application ID">
        <IdField>{application.appKey}</IdField>
      </GoabFormItem>
      <GoabFormItem error={errors?.['description']} label="Description">
        <GoabTextArea
          name="description"
          width="100%"
          value={appDescription ? appDescription : application?.description}
          testId="application-description"
          onChange={(detail: GoabTextAreaOnChangeDetail) => {
            validators.remove('description');
            validators['description'].check(detail.value);
            setApplication({
              ...application,
              description: detail.value,
            });
            setAppDescription(detail.value);
          }}
          aria-label="description"
        />
        <HelpTextComponent
          length={application?.description?.length || 0}
          maxLength={180}
          descErrMessage={descErrMessage}
          errorMsg={errors?.['description']}
        />
      </GoabFormItem>
      <GoabFormItem error={errors?.['url']} label="URL">
        <GoabInput
          type="url"
          name="url"
          width="100%"
          value={application?.endpoint?.url}
          aria-label="input-url"
          testId="application-url-input"
          onChange={(detail: GoabInputOnChangeDetail) => {
            validators.remove('url');
            validators['url'].check(detail.value);
            setApplication({
              ...application,
              endpoint: {
                url: detail.value,
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
      </GoabFormItem>
    </GoabModal>
  );
};

export default ApplicationFormModal;
