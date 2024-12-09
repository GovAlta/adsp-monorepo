import React, { useState } from 'react';
import { FormDefinition } from '@store/form/model';
import { OverflowWrap, EntryDetail } from '../styled-components';
import { useNavigate } from 'react-router-dom';
import { RootState } from '@store/index';
import { useDispatch, useSelector } from 'react-redux';
import { GoAContextMenu, GoAContextMenuIcon } from '@components/ContextMenu';
import { selectFormAppLink } from '@store/form/selectors';
import { isValidUrl } from '@lib/validation/urlUtil';
import { openEditorForDefinition } from '@store/form/action';
interface PdfTemplateItemProps {
  formDefinition: FormDefinition;
  onDelete?: (FormDefinition) => void;
}

export const FormDefinitionItem = ({ formDefinition, onDelete }: PdfTemplateItemProps): JSX.Element => {
  const [showSchema, setShowSchema] = useState(false);
  const formDescription =
    formDefinition.description?.length > 80
      ? formDefinition.description?.substring(0, 80) + '...'
      : formDefinition.description;
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const formLink = useSelector((state: RootState) => selectFormAppLink(state, formDefinition?.id));

  return (
    <>
      <tr>
        <td data-testid="form-definitions-name"><OverflowWrap>{formDefinition.name}</OverflowWrap></td>
        <td data-testid="form-definitions-template-id"><OverflowWrap>{formDefinition.id}</OverflowWrap></td>
        <td data-testid="form-definitions-description"><OverflowWrap>{formDescription}</OverflowWrap></td>
        <td data-testid="form-definitions-action">
          <GoAContextMenu>
            <GoAContextMenuIcon
              type={showSchema ? 'eye-off' : 'eye'}
              title="Toggle details"
              onClick={() => setShowSchema(!showSchema)}
              testId="form-toggle-details-visibility"
            />
            <GoAContextMenuIcon
              type="open"
              title="Open Form"
              onClick={() => {
                if (isValidUrl(formLink)) {
                  window.open(formLink, '_blank');
                } else {
                  console.error('Invalid URL:', formLink);
                }
              }}
              testId="form-app-open"
            />
            <GoAContextMenuIcon
              testId="form-definition-edit"
              title="Edit"
              type="create"
              onClick={() => {
                dispatch(openEditorForDefinition(formDefinition.id));
                navigate({
                  pathname: `edit/${formDefinition.id}`,
                  search: '?headless=true',
                });
              }}
            />
            <GoAContextMenuIcon
              testId={`form-definition-delete`}
              title="Delete"
              type="trash"
              onClick={() => onDelete(formDefinition)}
            />
          </GoAContextMenu>
        </td>
      </tr>
      {showSchema && (
        <tr>
          <td
            colSpan={7}
            style={{
              padding: '0px',
            }}
          >
            <EntryDetail data-testid="configuration-details">
              {JSON.stringify(formDefinition.dataSchema, null, 2)}
            </EntryDetail>
          </td>
        </tr>
      )}
    </>
  );
};
