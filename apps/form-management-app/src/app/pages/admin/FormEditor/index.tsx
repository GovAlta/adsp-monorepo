import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { AppDispatch, FormDefinition } from '../../../state';
import { updateDefinition, getFormConfiguration} from '../../../state/form/form.slice';
import { Editor } from './Editor';
import { savedDefinition } from '../../../state/form/selectors';
import { JSONSchema } from '@apidevtools/json-schema-ref-parser';

function digestConfiguration(configuration: FormDefinition | null): string {
  return JSON.stringify(
    Object.keys(configuration || {})
      .sort()
      .reduce((values, key) => ({ ...values, [key]: configuration[key] }), {})
  );
}

const EditorWrapper = (): JSX.Element => {
  const { id } = useParams<{ id: string }>();

  const dispatch = useDispatch<AppDispatch>();

  const [tempDefinition, setTempDefinition] = useState<FormDefinition | null>(null);

  useEffect(() => {
    try {
      if (id) {
        dispatch(getFormConfiguration({ id }));
      }
    } catch (e) {
      console.error('error:' + JSON.stringify(e));
    }
  }, [id,  dispatch]);

  const definition = useSelector(savedDefinition);

  useEffect(() => {
    setTempDefinition(definition || null);
  }, [definition]);

  const isFormUpdatedFunction = () => {
    const originalDigest = digestConfiguration(definition);
    const modifiedDigest = digestConfiguration(tempDefinition);
    return originalDigest !== modifiedDigest;
  };

  const isFormUpdated = isFormUpdatedFunction();

  const updateFormDefinition = () => {
    if (tempDefinition) {
      dispatch(updateDefinition(tempDefinition));
    }
  };

  const setDraftData = (dataDefinition: string) => {
    try {
      const parsedSchema = JSON.parse(dataDefinition) as JSONSchema;
      const tempSchema = {
        ...(tempDefinition ?? definition ?? {}),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        dataSchema: parsedSchema as unknown as any,
      } as FormDefinition;
      setTempDefinition(tempSchema);
    } catch (err) {
      console.error('Failed to parse data schema: ' + err);
    }
  };
  const setDraftUi = (uiDefinition: string) => {
    try {
      const parsedSchema = JSON.parse(uiDefinition) as JSONSchema;
      const tempSchema = {
        ...(tempDefinition ?? definition ?? {}),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        uiSchema: parsedSchema as unknown as any,
      } as FormDefinition;
      setTempDefinition(tempSchema);
    } catch (err) {
      console.error('Failed to parse data schema: ' + err);
    }
  };

  return (
    <div>
      <div className="form-template-editor-container">
        {definition?.id && (
          <Editor
            updateFormDefinition={updateFormDefinition}
            definition={definition}
            setDraftDataSchema={setDraftData}
            setDraftUiSchema={setDraftUi}
            isFormUpdated={isFormUpdated}
          />
        )}
      </div>
    </div>
  );
};

export default EditorWrapper
