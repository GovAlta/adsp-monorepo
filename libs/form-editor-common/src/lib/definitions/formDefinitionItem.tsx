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
  TagBadgePadding,
} from '../styled-components';
import { useNavigate } from 'react-router-dom';
import { RootState } from '@store/index';
import { useDispatch, useSelector } from 'react-redux';
import { GoAContextMenu, GoAContextMenuIcon } from '@components/ContextMenu';
import { selectFormAppLink, selectFormResourceTags } from '@store/form/selectors';
import { isValidUrl } from '@lib/validation/urlUtil';
import { fetchFormResourceTags, openEditorForDefinition } from '@store/form/action';
import { GoABadge, GoACircularProgress } from '@abgov/react-components';
import { EntryDetail } from '../styled-components';
import { UpdateSearchCriteriaAndFetchEvents, fetchCalendars } from '@store/calendar/actions';
interface FormDefinitionItemProps {
  formDefinition: FormDefinition;
  baseResourceFormUrn: string;
  onDelete?: (FormDefinition) => void;
  onAddResourceTag?: (FormDefinition) => void;
}

const safeFormat = (input: unknown) => {
  const date =
    //eslint-disable-next-line
    typeof input === 'object' && input && 'toDate' in input ? (input as any).toDate() : new Date(input as any);

  //eslint-disable-next-line
  if (isNaN(date as any)) return '—';

  try {
    return date.toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZoneName: 'short',
    });
  } catch {
    // Fallback for runtimes without dateStyle/timeStyle
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    });
  }
};

const FormDefinitionDetails = ({ formDefinition }: { formDefinition: FormDefinition }) => {
  const resourceTags = useSelector((state: RootState) => selectFormResourceTags(state, formDefinition?.id));
  const selectedCoreEvent = useSelector(
    (state: RootState) =>
      state.calendarService?.coreCalendars?.['form-intake']?.calendarEvents?.[formDefinition?.id] ?? null // fallback (optional)
  );

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
              <TagBadgePadding>
                <GoABadge
                  type={'midtone'}
                  content={tag.label}
                  testId={tag.label}
                  mb="xs"
                  mr="xs"
                  icon={false}
                ></GoABadge>
              </TagBadgePadding>
            ))}
        </DetailsTagWrapper>
      )}

      <DetailsTagHeading>Intake Period(s)</DetailsTagHeading>

      {selectedCoreEvent && selectedCoreEvent.length > 0 ? (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Start time</th>
              <th>End time</th>
            </tr>
          </thead>
          <tbody>
            {selectedCoreEvent.map((coreEvent, index) => (
              <tr key={index} style={{ margin: '20px 0' }}>
                <td>{coreEvent?.name}</td>
                <td>{safeFormat(coreEvent?.start)}</td>
                <td>{safeFormat(coreEvent?.end)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No intake periods configured for this form</p>
      )}

      <div>
        <DetailsTagHeading>Generate PDF on submit</DetailsTagHeading>
        {formDefinition.submissionPdfTemplate ? 'true' : 'false'}
      </div>

      <div>
        <DetailsTagHeading>Submission Record</DetailsTagHeading>
        {formDefinition.submissionRecords ? 'true' : 'false'}
      </div>

      {formDefinition.dispositionStates && formDefinition.dispositionStates.length > 0 && (
        <div>
          <DetailsTagHeading>Disposition States</DetailsTagHeading>
          {formDefinition.dispositionStates.map((x) => (
            <p>{x.name}</p>
          ))}
        </div>
      )}
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

  useEffect(() => {
    dispatch(fetchCalendars());
  }, []);

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
                  dispatch(
                    UpdateSearchCriteriaAndFetchEvents({
                      recordId: `urn:ads:platform:configuration-service:v2:/configuration/form-service/${formDefinition.id}`,
                      calendarName: 'form-intake',
                    })
                  );
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
