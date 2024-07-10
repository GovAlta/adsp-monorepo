import React, { useState } from 'react';
import { RefDefinition } from '@store/form/model';
import { updateRefDefinition } from '@store/form/action';
import { OverflowWrap } from '../styled-components';
import { RootState } from '@store/index';
import { useSelector, useDispatch } from 'react-redux';
import { GoAContextMenu, GoAContextMenuIcon } from '@components/ContextMenu';
import { selectFormAppLink } from '@store/form/selectors';
import { GoAIconButton } from '@abgov/react-components-new';
import { AddEditRefs } from './addEditRef';

interface PdfTemplateItemProps {
  formDefinition: RefDefinition;
  onDelete: (FormDefinition) => void;
}

export const RefItem = ({ formDefinition, onDelete }: PdfTemplateItemProps): JSX.Element => {
  const dispatch = useDispatch();
  const RefDefinition = Object.entries(formDefinition);
  const formDescription = formDefinition.refData;

  const formLink = useSelector((state: RootState) => selectFormAppLink(state, formDefinition?.id));

  const [openEditFormTemplate, setOpenEditFormTemplate] = useState(false);

  return (
    <>
      <tr>
        <td data-testid="form-definitions-name">{formDefinition.name}</td>
        <td data-testid="form-definitions-template-id">{formDefinition.id}</td>
        <td data-testid="form-definitions-description">
          <OverflowWrap>{formDescription as string}</OverflowWrap>
        </td>
        <td data-testid="form-definitions-action">
          <GoAContextMenu>
            <GoAContextMenuIcon
              testId={`form-definition-delete`}
              title="Delete"
              type="trash"
              onClick={() => onDelete(formDefinition)}
            />
            <GoAIconButton
              icon="create"
              testId="form-template-information-edit-icon"
              title="Edit"
              size="small"
              onClick={() => setOpenEditFormTemplate(true)}
            />
          </GoAContextMenu>
        </td>
      </tr>
      {openEditFormTemplate && (
        <AddEditRefs
          open={openEditFormTemplate}
          isEdit={true}
          onClose={() => setOpenEditFormTemplate(false)}
          initialValue={formDefinition}
          onSave={(definition) => {
            dispatch(updateRefDefinition(definition));
          }}
        />
      )}
    </>
  );
};
