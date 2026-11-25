import React, { useEffect, useRef, useState } from 'react';
import { GoabButton, GoabButtonGroup, GoabCallout, GoabModal } from '@abgov/react-components';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@store/index';
import {
  setUpSharepointDestination,
  SharepointColumnReport,
  SharepointDestination,
  SharepointDocumentLibraryReport,
  SharepointListReport,
  SharepointVerifyReport,
  verifySharepointDestination,
} from '@store/sharePoint/actions';
import { VerifyList } from '../styled-components';
import { describeTestFailure } from './destinationHelpers';
import { COLUMN_TYPES } from './mappingRows';

const typeLabel = (type?: string) => COLUMN_TYPES.find(({ value }) => value === type)?.label ?? type ?? 'Any';

const REPORTED_TYPE_LABELS: Record<string, string> = {
  choice: 'Choice (single)',
  other: 'a Lookup, Person or other special column',
  unknown: 'of a type SharePoint does not report',
};
const actualTypeLabel = (type?: string) => REPORTED_TYPE_LABELS[type] ?? typeLabel(type);

const PURPOSES: Record<SharepointColumnReport['purpose'], string> = {
  key: 'Row key (indexed)',
  parent: 'Parent reference (indexed)',
  folder: 'Files folder link',
  mapped: 'Mapped data',
};

export function describeColumnStatus(column: SharepointColumnReport): string {
  switch (column.status) {
    case 'ok':
      return 'Ready';
    case 'notIndexed':
      return 'Not indexed';
    case 'wrongType':
      return `Wrong type: it is ${actualTypeLabel(column.actualType)}, the mapping needs ${typeLabel(column.expectedType)}`;
    case 'missing':
      return column.matchingName
        ? `Missing. A column shown as '${column.name}' exists with the internal name '${column.matchingName}'; use that name in the mapping.`
        : 'Missing';
  }
}

const listHeading = (list: SharepointListReport) =>
  list.kind === 'main' ? 'Main list' : `Detail list: ${list.listName || list.dataPath}`;

const LIST_STATUS: Record<SharepointListReport['status'], string> = {
  ok: '',
  notCreated: 'Not created yet.',
  notFound: 'Not found on the site. Check the list ID.',
};

const LIBRARY_STATUS: Record<SharepointDocumentLibraryReport['status'], string> = {
  ok: 'Ready',
  notCreated: 'Not created yet.',
  notFound: 'Not found on the site. Check the document library ID.',
  notADocumentLibrary: 'This is a list, not a document library. Use the ID of a document library.',
};

// What the site owner has to do by hand when the app's grant can't change lists or columns.
export function manualSteps(report: SharepointVerifyReport): string[] {
  const listSteps = report.lists.flatMap((list) => {
    const name = list.kind === 'main' ? 'the main list' : `'${list.listName || list.dataPath}'`;
    const describe = (column: SharepointColumnReport) =>
      `${column.name} (${typeLabel(column.expectedType ?? 'text')}${column.purpose === 'key' || column.purpose === 'parent' ? ', indexed' : ''})`;
    if (list.status === 'notCreated') {
      return [
        `Create a list named ${name} with these columns: ${list.columns.map(describe).join(', ')}. Then enter its ID on the destination.`,
      ];
    }
    if (list.status === 'notFound') {
      return [];
    }
    return [
      ...list.columns
        .filter(({ status }) => status === 'missing')
        .map((column) => `Add ${describe(column)} to ${name}.`),
      ...list.columns
        .filter(({ status }) => status === 'notIndexed')
        .map((column) => `Index the ${column.name} column of ${name}.`),
    ];
  });
  const library = report.documentLibrary;
  return library?.status === 'notCreated'
    ? [
        ...listSteps,
        `Create a document library named '${library.libraryName}'. Then enter its ID as the document library ID on the destination.`,
      ]
    : listSteps;
}

const needsSetup = (report?: SharepointVerifyReport) =>
  report?.documentLibrary?.status === 'notCreated' ||
  !!report?.lists.some(
    ({ status, columns }) =>
      status === 'notCreated' ||
      (status === 'ok' &&
        columns.some(({ status: columnStatus }) => columnStatus === 'missing' || columnStatus === 'notIndexed')),
  );

interface VerifySetupModalProps {
  destination: SharepointDestination;
  onClose: () => void;
}

export const VerifySetupModal = ({ destination, onClose }: VerifySetupModalProps): JSX.Element => {
  const dispatch = useDispatch();
  const result = useSelector((state: RootState) => state.sharepoint.verifyResults?.[destination.id]);
  const report = result?.report;
  const topRef = useRef<HTMLDivElement>(null);
  const [scrollWhenDone, setScrollWhenDone] = useState(false);

  useEffect(() => {
    if (!result?.loading) {
      dispatch(verifySharepointDestination(destination.id));
    }
    // Verify once on open; a save that opened this modal has already started one.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (scrollWhenDone && !result?.loading) {
      topRef.current?.scrollIntoView?.({ block: 'start' });
      setScrollWhenDone(false);
    }
  }, [scrollWhenDone, result?.loading]);

  const runSetup = () => {
    setScrollWhenDone(true);
    dispatch(setUpSharepointDestination(destination.id));
  };

  const setup = result?.setup;
  const idle = !result?.loading;
  const libraryStatus = report?.documentLibrary?.status;
  const libraryUnusable = libraryStatus === 'notFound' || libraryStatus === 'notADocumentLibrary';
  return (
    <GoabModal
      testId="verify-setup-modal"
      open={true}
      maxWidth="900px"
      heading={`Verify setup: ${destination.name}`}
      actions={
        <GoabButtonGroup alignment="end">
          <GoabButton size="compact" type="secondary" testId="verify-setup-close" onClick={onClose}>
            Close
          </GoabButton>
          <GoabButton
            size="compact"
            type="secondary"
            testId="verify-setup-again"
            disabled={!idle}
            onClick={() => dispatch(verifySharepointDestination(destination.id))}
          >
            Verify again
          </GoabButton>
          <GoabButton
            size="compact"
            type="primary"
            testId="verify-setup-run"
            disabled={!idle || !needsSetup(report)}
            onClick={runSetup}
          >
            Setup required lists and columns
          </GoabButton>
        </GoabButtonGroup>
      }
    >
      <div ref={topRef} />
      {!idle && (
        <GoabCallout type="information" heading="Checking SharePoint" testId="verify-setup-loading">
          Reading the list and column definitions…
        </GoabCallout>
      )}
      {idle && result?.errorCode && (
        <GoabCallout type="emergency" heading="Could not verify" testId="verify-setup-error">
          {describeTestFailure(result.errorCode)}
        </GoabCallout>
      )}
      {idle && result?.listNameTaken && (
        <GoabCallout type="important" heading="A list with that name already exists" testId="verify-setup-name-taken">
          {result.listNameTaken.map(({ listName }) => `'${listName}'`).join(', ')} already exists on the site. Change
          the detail list's name on the destination, or enter that list's ID if you meant to use it.
        </GoabCallout>
      )}
      {idle && setup && !setup.permissionDenied && (
        <GoabCallout
          type={setup.failures.length ? 'important' : 'success'}
          heading="Setup finished"
          testId="verify-setup-done"
        >
          Created {setup.createdLists.length} lists and {setup.createdColumns.length} columns, and indexed{' '}
          {setup.indexedColumns.length} columns.
          {setup.createdLibrary && ` Created the document library '${setup.createdLibrary.libraryName}'.`}
          {setup.failures.length > 0 && (
            <ul>
              {setup.failures.map((failure, index) => (
                <li key={index}>
                  {failure.name ?? 'List'}:{' '}
                  {failure.errorCode === 'invalid-column-name'
                    ? 'SharePoint cannot use this column name. Use letters, numbers and underscores.'
                    : describeTestFailure(failure.errorCode)}
                </li>
              ))}
            </ul>
          )}
        </GoabCallout>
      )}
      {idle && setup?.permissionDenied && report && (
        <GoabCallout type="important" heading="The app can't add lists or columns" testId="verify-setup-manual">
          <p>Its grant on the site only lets it write rows. Ask the site owner to:</p>
          <ul>
            {manualSteps(report).map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ul>
        </GoabCallout>
      )}
      {idle && libraryUnusable && (
        <GoabCallout type="important" heading="The document library can't be used" testId="verify-setup-library">
          {LIBRARY_STATUS[libraryStatus]}
        </GoabCallout>
      )}
      {idle && report?.ready && (
        <GoabCallout type="success" heading="Ready" testId="verify-setup-ready">
          Every list and column this destination needs is in place.
        </GoabCallout>
      )}

      {report?.lists.map((list, index) => (
        <VerifyList key={index} data-testid={`verify-list-${index}`}>
          <h3>{listHeading(list)}</h3>
          {LIST_STATUS[list.status] && <p>{LIST_STATUS[list.status]}</p>}
          <table>
            <thead>
              <tr>
                <th>Column</th>
                <th>Used for</th>
                <th>Type</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {list.columns.map((column) => (
                <tr key={column.name}>
                  <td>
                    {column.name}
                    {column.displayName !== column.name && <div>{column.displayName}</div>}
                  </td>
                  <td>{PURPOSES[column.purpose]}</td>
                  <td>{typeLabel(column.expectedType)}</td>
                  <td>{describeColumnStatus(column)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </VerifyList>
      ))}
      {report?.documentLibrary && (
        <VerifyList data-testid="verify-document-library">
          <h3>Document library</h3>
          <p>{report.documentLibrary.libraryName ?? report.documentLibrary.libraryId}</p>
          <p>{LIBRARY_STATUS[report.documentLibrary.status]}</p>
        </VerifyList>
      )}
    </GoabModal>
  );
};
