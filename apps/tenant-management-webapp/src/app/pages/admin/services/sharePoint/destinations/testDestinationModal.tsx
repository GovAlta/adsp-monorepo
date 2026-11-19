import React, { useState } from 'react';
import {
  GoabButton,
  GoabButtonGroup,
  GoabCallout,
  GoabFormItem,
  GoabModal,
  GoabTextArea,
} from '@abgov/react-components';
import { GoabTextAreaOnChangeDetail } from '@abgov/ui-components-common';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@store/index';
import { SharepointDestination, testSharepointDestination } from '@store/sharePoint/actions';
import { ADSP_KEY_FIELD } from '@store/sharePoint/model';
import { describeDetailFailures, describeTestFailure, sampleTestData } from './destinationHelpers';

const SAMPLE_HELP =
  "Fill in each value using the column's type: numbers without quotes, dates like 2026-11-05, and true or false for yes/no.";
const ROW_KEY_HELP = ' Keep the same key value for the "_adsp" to update the row, or change it to add a new row.';

interface TestDestinationModalProps {
  destination: SharepointDestination;
  onClose: () => void;
}

export const TestDestinationModal = ({ destination, onClose }: TestDestinationModalProps): JSX.Element => {
  const dispatch = useDispatch();
  const result = useSelector((state: RootState) => state.sharepoint.testResults[destination.id]);
  const [text, setText] = useState(() =>
    JSON.stringify(
      sampleTestData(destination.fieldMappings, destination.idempotencyFields, destination.detailLists),
      null,
      2,
    ),
  );
  const [parseError, setParseError] = useState<string>();
  const [hasRun, setHasRun] = useState(false);
  const updatesRows = !!destination.idempotencyFields?.includes(ADSP_KEY_FIELD);
  const detailListName = (listId: string) => {
    const list = destination.detailLists?.find((candidate) => candidate.listId === listId);
    return list?.listName || list?.dataPath || listId;
  };

  const run = () => {
    try {
      const data = JSON.parse(text);
      if (!data || typeof data !== 'object' || Array.isArray(data)) {
        throw new Error();
      }
      setParseError(undefined);
      setHasRun(true);
      dispatch(testSharepointDestination(destination.id, data));
    } catch {
      setParseError('Enter test data as a JSON object.');
    }
  };

  return (
    <GoabModal
      testId="test-destination-modal"
      open={true}
      heading={`Test ${destination.name}`}
      actions={
        <GoabButtonGroup alignment="end">
          <GoabButton size="compact" type="secondary" testId="test-destination-close" onClick={onClose}>
            Close
          </GoabButton>
          <GoabButton size="compact" type="primary" testId="test-destination-run" onClick={run}>
            Run test
          </GoabButton>
        </GoabButtonGroup>
      }
    >
      <p>
        The test pushes this data exactly as a real submission would, so it writes a real row to the list. Don't use
        real personal information.
      </p>
      <GoabFormItem
        label="Test data (JSON)"
        error={parseError}
        helpText={updatesRows ? SAMPLE_HELP + ROW_KEY_HELP : SAMPLE_HELP}
      >
        <GoabTextArea
          name="test-data"
          testId="test-data"
          rows={10}
          width="100%"
          value={text}
          onChange={(detail: GoabTextAreaOnChangeDetail) => setText(detail.value)}
        />
      </GoabFormItem>
      {hasRun && !result && (
        <GoabCallout type="information" heading="Running test">
          Writing the test data to the list…
        </GoabCallout>
      )}
      {hasRun && result?.ok === true && (
        <GoabCallout type="success" heading="Test passed">
          {result.outcome === 'updated'
            ? 'The test data updated the existing row with this key.'
            : 'The test data was added to the list as a new row.'}
          {result.detailRows?.map(({ listId, rowIds }) => (
            <div key={listId}>
              {detailListName(listId)}: {rowIds.length} {rowIds.length === 1 ? 'row' : 'rows'} written.
            </div>
          ))}
        </GoabCallout>
      )}
      {hasRun && result && result.ok === false && (
        <GoabCallout type="emergency" heading="Test failed">
          {result.detailFailures
            ? 'The main row was written, but some detail lists were not fully updated.'
            : describeTestFailure(result.errorCode, result.column)}
          {result.detailFailures &&
            describeDetailFailures(result.detailFailures, destination.detailLists).map((line) => (
              <div key={line}>{line}</div>
            ))}
        </GoabCallout>
      )}
    </GoabModal>
  );
};
