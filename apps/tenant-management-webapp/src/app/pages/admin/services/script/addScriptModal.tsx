import React, { useEffect, useState, useRef } from 'react';
import {
  GoabCheckbox,
  GoabTextArea,
  GoabButton,
  GoabButtonGroup,
  GoabInput,
  GoabFormItem,
  GoabModal,
} from '@abgov/react-components';
import { ScriptItem, defaultScript } from '@store/script/models';
import { useSelector, useDispatch } from 'react-redux';
import { useValidators } from '@lib/validation/useValidators';
import { toKebabName } from '@lib/kebabName';
import { isNotEmptyCheck, wordMaxLengthCheck, duplicateNameCheck, badCharsCheck } from '@lib/validation/checkInput';
import { IdField } from './styled-components';
import { RootState } from '@store/index';
import { ClientRoleTable } from '@components/RoleTable';
import { selectRoleList } from '@store/sharedSelectors/roles';
import { fetchKeycloakServiceRoles } from '@store/access/actions';
import { FetchRealmRoles } from '@store/tenant/actions';
import { TextGoASkeleton } from '@core-services/app-common';
import { HelpTextComponent } from '@components/HelpTextComponent';
import { GoabTextAreaOnKeyPressDetail, GoabInputOnChangeDetail } from '@abgov/ui-components-common';

interface AddScriptModalProps {
  initialValue?: ScriptItem;
  onCancel?: () => void;
  onSave: (script: ScriptItem) => void;
  openEditorOnAdd?: (script: ScriptItem) => void;
  open: boolean;
  isNew: boolean;
}

export const AddScriptModal = ({
  initialValue,
  onCancel,
  onSave,
  open,
  openEditorOnAdd,
  isNew,
}: AddScriptModalProps): JSX.Element => {
  const [script, setScript] = useState<ScriptItem>(initialValue);
  const dispatch = useDispatch();

  const scripts = useSelector((state: RootState) => {
    return state?.scriptService?.scripts;
  });
  const descErrMessage = 'Script description can not be over 180 characters';
  const scrollPaneRef = useRef<HTMLDivElement>(null);
  const roles = useSelector(selectRoleList);
  const scriptNames = scripts ? Object.keys(scripts) : [];
  const { errors, validators } = useValidators(
    'name',
    'name',
    badCharsCheck,
    wordMaxLengthCheck(32, 'Name'),
    isNotEmptyCheck('name')
  )
    .add('description', 'description', wordMaxLengthCheck(250, 'Description'))
    .add('duplicated', 'name', duplicateNameCheck(scriptNames, 'Script'))
    .build();

  // eslint-disable-next-line
  useEffect(() => {}, [roles]);

  useEffect(() => {
    dispatch(FetchRealmRoles());
    dispatch(fetchKeycloakServiceRoles());
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const validationCheck = () => {
    const validations = {
      name: script.id,
    };
    if (isNew) {
      validations['duplicated'] = script.id;
    }
    if (!validators.checkAll(validations)) {
      return;
    }

    onSave(script);
    if (isNew) {
      if (openEditorOnAdd) {
        openEditorOnAdd(script);
      }
    } else {
      if (onCancel) {
        onCancel();
      }
    }
    validators.clear();
  };

  const RunnerRole = ({ roleNames, clientId }) => {
    return (
      <ClientRoleTable
        roles={roleNames}
        clientId={clientId}
        roleSelectFunc={(roles) => {
          setScript({
            ...script,
            runnerRoles: roles,
          });
        }}
        nameColumnWidth={80}
        service="Script"
        checkedRoles={[{ title: 'runner', selectedRoles: script?.runnerRoles }]}
      />
    );
  };

  return (
    <GoabModal
      testId="add-script-modal"
      open={open}
      heading={isNew ? 'Add script' : 'Edit script'}
      actions={
        <GoabButtonGroup alignment="end">
          <GoabButton
            type="secondary"
            testId="script-modal-cancel"
            onClick={() => {
              setScript(defaultScript);
              validators.clear();
              if (onCancel) {
                onCancel();
              }
            }}
          >
            Cancel
          </GoabButton>
          <GoabButton
            type="primary"
            testId="script-modal-save"
            disabled={script.name === '' || (validators && validators.haveErrors())}
            onClick={() => {
              validationCheck();
            }}
          >
            Save
          </GoabButton>
        </GoabButtonGroup>
      }
    >
      <div
        ref={scrollPaneRef}
        className="roles-scroll-pane"
        style={{ overflowY: 'auto', maxHeight: '70vh', padding: '0 3px 0 3px' }}
      >
        <GoabFormItem error={errors?.['name']} label="Name">
          <GoabInput
            type="text"
            name="name"
            value={script.name}
            width="100%"
            testId={`script-modal-name-input`}
            aria-label="name"
            onChange={(detail: GoabInputOnChangeDetail) => {
              const scriptId = toKebabName(detail.value);
              validators.remove('name');
              const validations = {
                name: detail.value,
              };
              validations['duplicated'] = scriptId;
              validators.checkAll(validations);
              if (isNew) {
                setScript({ ...script, name: detail.value, id: scriptId });
              } else {
                setScript({ ...script, name: detail.value });
              }
            }}
            onBlur={() => {
              validators.checkAll({ name: script.name });
            }}
          />
        </GoabFormItem>
        <GoabFormItem label="Script ID">
          <IdField>{script.id}</IdField>
        </GoabFormItem>
        <GoabFormItem error={errors?.['description']} label="Description">
          <GoabTextArea
            name="description"
            value={script.description}
            testId={`script-modal-description-input`}
            aria-label="description"
            width="100%"
            // eslint-disable-next-line
            onChange={() => {}}
            onKeyPress={(detail: GoabTextAreaOnKeyPressDetail) => {
              const description = detail.value;
              validators.remove('description');
              validators['description'].check(description);
              setScript({ ...script, description });
            }}
          />
          <HelpTextComponent
            length={script?.description?.length || 0}
            maxLength={180}
            descErrMessage={descErrMessage}
            errorMsg={errors?.['description']}
          />
        </GoabFormItem>
        <br />
        {isNew && (
          <GoabCheckbox
            checked={script.useServiceAccount}
            name="script-use-service-account-checkbox"
            testId="script-use-service-account-checkbox"
            onChange={() => {
              setScript({
                ...script,
                useServiceAccount: !script.useServiceAccount,
              });
            }}
            text="Use service account"
            ariaLabel={`script-use-service-account-checkbox`}
          />
        )}
        {Array.isArray(roles) &&
          isNew &&
          roles.map((r) => {
            return <RunnerRole roleNames={r?.roleNames} key={r?.clientId} clientId={r?.clientId} />;
          })}

        {Object.entries(roles).length === 0 && <TextGoASkeleton key={1} lineCount={4}></TextGoASkeleton>}
      </div>
    </GoabModal>
  );
};
