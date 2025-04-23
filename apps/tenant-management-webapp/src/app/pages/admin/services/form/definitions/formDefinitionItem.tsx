import React, { useEffect, useState } from 'react';
import { FormDefinition } from '@store/form/model';
import {
  OverflowWrap,
  TableDataName,
  TableDataDescription,
  DetailsTagWrapper,
  DetailsTagHeading,
  DetailsTagDefinitionIdHeading,
  CenterPositionProgressIndicator,
} from '../styled-components';
import { useNavigate } from 'react-router-dom';
import { RootState } from '@store/index';
import { useDispatch, useSelector } from 'react-redux';
import { GoAContextMenu, GoAContextMenuIcon } from '@components/ContextMenu';
import { selectFormAppLink, selectFormResourceTags } from '@store/form/selectors';
import { isValidUrl } from '@lib/validation/urlUtil';
import { fetchFormResourceTags, openEditorForDefinition } from '@store/form/action';
import { GoABadge, GoACircularProgress, GoADetails } from '@abgov/react-components';
import { EntryDetail } from '../../styled-components';
interface FormDefinitionItemProps {
  formDefinition: FormDefinition;
  baseResourceFormUrn: string;
  onDelete?: (FormDefinition) => void;
  onAddResourceTag?: (FormDefinition) => void;
}

const FormDefinitionDetails = ({ formDefinition }: { formDefinition: FormDefinition }) => {
  const resourceTags = useSelector((state: RootState) => selectFormResourceTags(state, formDefinition?.id));

  return (
    <>
      <DetailsTagDefinitionIdHeading>Definition ID</DetailsTagDefinitionIdHeading>
      {formDefinition.id}
      <DetailsTagHeading>Tags</DetailsTagHeading>
      {resourceTags === undefined && (
        <CenterPositionProgressIndicator>
          <GoACircularProgress visible={true} size="small" />
        </CenterPositionProgressIndicator>
      )}
      {resourceTags && resourceTags?.length > 0 && (
        <DetailsTagWrapper>
          {resourceTags
            ?.sort((a, b) => a.label?.toLowerCase().localeCompare(b.label?.toLowerCase()))
            .map((tag) => (
              <GoABadge type={'midtone'} content={tag.label} testId={tag.label} mb="xs" mr="xs"></GoABadge>
            ))}
        </DetailsTagWrapper>
      )}
      <p></p>
      <DetailsTagDefinitionIdHeading>Form intake information including</DetailsTagDefinitionIdHeading>
      <li>from when (date time) to when (date time) the form will be available to users for submission</li>
      <li>date time values show in client time zone</li>
      <p></p>
      <DetailsTagDefinitionIdHeading>Form submission information</DetailsTagDefinitionIdHeading>
      {formDefinition.submissionPdfTemplate ? (
        <div>
          <p>Creates PDF when submitted</p>
          PDF copy of the submitted information is created when forms are submitted.
        </div>
      ) : (
        <div>
          <p>No PDF is created</p>
          PDF copy is not created when forms are submitted.
        </div>
      )}
      <p>Has submission Records: {formDefinition.submissionRecords ? 'Yes' : 'No'}</p>
      <div>
        {formDefinition.dispositionStates.map((state, index) => {
          return (
            <div>
              Disposition {index + 1}
              <ul>
                <li>{state.id}</li>
                <li>{state.name}</li>
                <li>{state.description}</li>
              </ul>
            </div>
          );
        })}
      </div>
      <pre>{JSON.stringify(formDefinition, null, 2)}</pre>
    </>
  );
};

export const FormDefinitionItem = ({
  formDefinition,
  baseResourceFormUrn,
  onDelete,
  onAddResourceTag,
}: FormDefinitionItemProps): JSX.Element => {
  const [showDetails, setShowDetails] = useState(false);
  const formDescription =
    formDefinition.description?.length > 80
      ? formDefinition.description?.substring(0, 80) + '...'
      : formDefinition.description;
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const formLink = useSelector((state: RootState) => selectFormAppLink(state, formDefinition?.id));
  const resourceTags = useSelector((state: RootState) => selectFormResourceTags(state, formDefinition?.id));

  return (
    <>
      <tr>
        <TableDataName data-testid="form-definitions-name">
          <OverflowWrap>{formDefinition.name}</OverflowWrap>
        </TableDataName>
        <TableDataDescription data-testid="form-definitions-description">
          <OverflowWrap>{formDescription}</OverflowWrap>
        </TableDataDescription>
        <td data-testid="form-definitions-action">
          <GoAContextMenu>
            <GoAContextMenuIcon
              type={showDetails ? 'eye-off' : 'eye'}
              title="Toggle details"
              onClick={() => {
                if (!showDetails) {
                  if (baseResourceFormUrn && formDefinition.id.length > 0 && resourceTags === undefined) {
                    dispatch(fetchFormResourceTags(`${baseResourceFormUrn}/${formDefinition.id}`));
                  }
                }
                setShowDetails(!showDetails);
              }}
              testId="form-toggle-details-visibility"
            />
            <GoAContextMenuIcon
              type="open"
              title="Open form"
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
              title="Edit form"
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
              testId="form-definition-resource-tag-edit"
              title="Add tag"
              type="add-circle"
              onClick={() => (onAddResourceTag ? onAddResourceTag(formDefinition) : null)}
            />
            <GoAContextMenuIcon
              testId={`form-definition-delete`}
              title="Delete"
              type="trash"
              onClick={() => (onDelete ? onDelete(formDefinition) : null)}
            />
          </GoAContextMenu>
        </td>
      </tr>
      {showDetails && (
        <tr>
          <td
            colSpan={7}
            style={{
              padding: '0px',
            }}
          >
            <EntryDetail data-testid="configuration-details">
              <FormDefinitionDetails data-testid="form-definition-details" formDefinition={formDefinition} />
            </EntryDetail>
          </td>
        </tr>
      )}
    </>
  );
};
