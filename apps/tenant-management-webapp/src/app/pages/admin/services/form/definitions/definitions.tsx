import $ from 'jquery';
import React, { useEffect, useState, useRef, createRef } from 'react';

import { GoAButton } from '@abgov/react-components-new';

import { useDispatch, useSelector } from 'react-redux';
import { getFormDefinitions, updateFormDefinition, deleteFormDefinition } from '@store/form/action';
import { RootState } from '@store/index';
import { renderNoItem } from '@components/NoItem';
import { FormDefinitionsTable } from './definitionsList';
import { PageIndicator } from '@components/Indicator';
import { defaultFormDefinition } from '@store/form/model';
import { DeleteModal } from '@components/DeleteModal';
import { AddEditFormDefinition } from './addEditFormDefinition';

import { GoATextArea } from '@abgov/react-components-new';
import 'jquery-ui-sortable';
declare const window: any;
window.jQuery = $;
window.$ = $;
//require('jquery-ui-sortable');
require('formBuilder');

require('formBuilder/dist/form-render.min.js');

const formDataDefault = [
  {
    type: 'header',
    subtype: 'h1',
    label: 'formBuilder in React',
  },
  {
    type: 'paragraph',
    label: 'This is a demonstration of formBuilder running in a React project.',
  },
];

interface FormDefinitionsProps {
  openAddDefinition: boolean;
}
export const FormDefinitions = ({ openAddDefinition }: FormDefinitionsProps) => {
  const fb = useRef();
  const fr = useRef();
  const myFormRef = useRef();
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [formData, setFormData] = useState(JSON.stringify(formDataDefault, undefined, 2) as any);
  const [newFormData, setNewFormData] = useState(null);
  const [grabFormData, setGrabFormData] = useState(null);
  const [currentDefinition, setCurrentDefinition] = useState(defaultFormDefinition);

  const [createdFormData, setCreatedFormData] = useState('');

  const formDefinitions = useSelector((state: RootState) => {
    return Object.entries(state?.form?.definitions)
      .sort((template1, template2) => {
        return template1[1].name.localeCompare(template2[1].name);
      })
      .reduce((tempObj, [formDefinitionId, formDefinitionData]) => {
        tempObj[formDefinitionId] = formDefinitionData;
        return tempObj;
      }, {});
  });

  const onSave = function (evt, formData) {
    //toggleEdit();
    //$('.render-wrap').formRender({ formData });
    console.log(JSON.stringify('wtf'));
    setFormData(JSON.stringify(JSON.parse(formData), undefined, 2));
    window.sessionStorage.setItem('formData', JSON.stringify(formData));
  };

  const myFunction = function (qqq) {
    console.log(JSON.stringify('saving here '));
    console.log(JSON.stringify(JSON.stringify(qqq)));
  };

  const [openAddFormDefinition, setOpenAddFormDefinition] = useState(false);

  const indicator = useSelector((state: RootState) => {
    return state?.session?.indicator;
  });

  const dispatch = useDispatch();

  useEffect(() => {
    $(fb.current).formBuilder({ formData, onSave });
    $(fr.current).formRender({ formData });
  }, []);
  useEffect(() => {
    if (grabFormData) {
      let tempCreatedFormData;
      const $form = $(myFormRef.current);

      $form.find('input').each(function () {
        const name = $(this).attr('name');
        const value = $(this).val();
        tempCreatedFormData[name] = value;
      });
      setCreatedFormData(tempCreatedFormData);
      setGrabFormData(false);
    }
  }, [grabFormData]);
  useEffect(() => {
    //console.log(JSON.parse(formData))
    $(fr.current).formRender({ formData: formData });
  }, [formData]);

  useEffect(() => {
    if (openAddDefinition) {
      setOpenAddFormDefinition(true);
    }
  }, [openAddDefinition]);

  useEffect(() => {
    dispatch(getFormDefinitions());
  }, []);

  const reset = () => {
    setOpenAddFormDefinition(false);
  };

  // eslint-disable-next-line
  useEffect(() => {}, [formDefinitions]);

  return (
    <>
      <div>
        <br />
        <GoAButton
          testId="add-definition"
          onClick={() => {
            setOpenAddFormDefinition(true);
          }}
        >
          Add definition
        </GoAButton>
        <br />
        <br />
        <PageIndicator />
        <div id="fb-editor" ref={fb} />
        {/* {JSON.stringify(formData, null, 2)} */}
        {/* <div>{formData}</div> */}

        <GoATextArea
          rows={7}
          name="supportInstruction"
          value={newFormData || formData}
          testId="form-support-instructions"
          aria-label="name"
          width="100%"
          onChange={(name, value) => setNewFormData(value)}
        />

        <GoAButton
          testId="add-definition"
          onClick={() => {
            setFormData(newFormData);
          }}
        >
          Update Original
        </GoAButton>
        <GoAButton
          testId="add-definition"
          onClick={() => {
            setGrabFormData(true);
          }}
        >
          Grab form data
        </GoAButton>
        <div ref={myFormRef} id="myForm">
          <div id="markup" ref={fr} />
        </div>

        {newFormData && JSON.stringify(newFormData, undefined, 2)}

        <AddEditFormDefinition
          open={openAddFormDefinition}
          isEdit={false}
          onClose={reset}
          initialValue={defaultFormDefinition}
          onSave={(definition) => {
            dispatch(updateFormDefinition(definition));
          }}
        />

        {JSON.stringify(createdFormData)}

        {!indicator.show && !formDefinitions && renderNoItem('form templates')}
        {!indicator.show && formDefinitions && (
          <FormDefinitionsTable
            definitions={formDefinitions}
            onDelete={(currentTemplate) => {
              setShowDeleteConfirmation(true);
              setCurrentDefinition(currentTemplate);
            }}
          />
        )}

        <DeleteModal
          isOpen={showDeleteConfirmation}
          title="Delete form definition"
          content={
            <div>
              Are you sure you wish to delete <b>{`${currentDefinition?.name}?`}</b>
            </div>
          }
          onCancel={() => setShowDeleteConfirmation(false)}
          onDelete={() => {
            setShowDeleteConfirmation(false);
            dispatch(deleteFormDefinition(currentDefinition));
          }}
        />
      </div>
    </>
  );
};
