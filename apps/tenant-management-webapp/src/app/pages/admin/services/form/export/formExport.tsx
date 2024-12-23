import React, { useEffect, useState } from 'react';

import { useDispatch, useSelector } from 'react-redux';

import { RootState } from '@store/index';
import { GoAButton, GoADropdown, GoADropdownItem, GoAFormItem } from '@abgov/react-components-new';
import { getFormDefinitions, getExportFormInfo } from '@store/form/action';
import { FormDefinition } from '@store/form/model';

export const FormExport = (): JSX.Element => {
  const dispatch = useDispatch();

  const [selectedForm, setSelectedForm] = useState<FormDefinition>();
  const [resourceType, setResourceType] = useState('');
  const formDefinitions = useSelector((state: RootState) => state.form.definitions);

  const formList: FormDefinition[] = Object.entries(formDefinitions).map(([, value]) => value);
  const next = useSelector((state: RootState) => state.form.nextEntries);

  const exportToCsv = () => {
    if (selectedForm?.submissionRecords === true) {
      dispatch(getExportFormInfo(selectedForm?.id, 'submissions'));
    } else {
      dispatch(getExportFormInfo(selectedForm.id, 'forms'));
    }
  };

  useEffect(() => {
    if (next) {
      dispatch(getFormDefinitions(next));
    }
  }, [next === 'NTA=']);

  return (
    <section>
      <div>
        <GoAFormItem label="Form types">
          <GoADropdown
            name="formTypes"
            value={selectedForm?.name}
            onChange={(name, value: string) => {
              const currentForm = formList.find((form) => form.name === value);
              setSelectedForm(currentForm);
              setResourceType(currentForm?.submissionRecords === true ? 'Submissions' : 'Forms');
            }}
            aria-label="form-selection-dropdown"
            width="100%"
            testId="form-selection-dropdown"
          >
            {formList.map((item) => (
              <GoADropdownItem
                name="formTypeList"
                key={item?.name}
                label={item?.name}
                value={item?.name}
                testId={`${item?.name}`}
              />
            ))}
          </GoADropdown>
        </GoAFormItem>
        <br />
        <GoAFormItem label="Records">
          <h3>{resourceType}</h3>
        </GoAFormItem>
        <br />
        <GoAButton
          type="primary"
          size="normal"
          variant="normal"
          onClick={exportToCsv}
          testId="exportBtn"
          disabled={!selectedForm || Object.keys(formDefinitions).length === 0}
        >
          Export
        </GoAButton>
      </div>
    </section>
  );
};
