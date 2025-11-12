import React, { FunctionComponent } from 'react';
import { Disposition } from '@store/form/model';
import { GoAContextMenuIcon } from '../components/ContextMenu';
import { Anchor, RowFlex } from './style-components';
import { EmptyBoxSpace, Flex, ActionSpace } from './style-components';

interface ActionComponentProps {
  dispositions: Array<Disposition>;
  openModalFunction?: (disposition: Disposition) => void;
  openDeleteModalFunction?: (disposition: Disposition) => void;
  updateDispositions?: (dispositions: Array<Disposition>) => void;
  submissionRecords: boolean;
}

interface ClickUpProps {
  dispositions: Array<Disposition>; // Assuming Disposition is a type you've defined elsewhere
  index: number;
  updateDispositions: (dispositions: Array<Disposition>) => void;
}

const ClickUp: React.FC<ClickUpProps> = ({ dispositions, index, updateDispositions }) => {
  return (
    <Anchor
      onClick={() => {
        const tempDispositions = [
          ...dispositions.slice(0, Math.max(index - 1, 0)),
          dispositions[index],
          dispositions[index - 1],
          ...dispositions.slice(Math.min(index + 1, dispositions.length), dispositions.length),
        ].filter(function (element) {
          return element !== undefined;
        });
        updateDispositions(tempDispositions);
      }}
      style={{ height: '24px' }}
    >
      <GoAContextMenuIcon type="arrow-up" title="Arrow-up" />
    </Anchor>
  );
};
const ClickDown: React.FC<ClickUpProps> = ({ dispositions, index, updateDispositions }) => {
  return (
    <Anchor
      onClick={() => {
        const tempDispositions = [
          ...dispositions.slice(0, Math.max(index, 0)),
          dispositions[index + 1],
          dispositions[index],
          ...dispositions.slice(Math.min(index + 2, dispositions.length), dispositions.length),
        ].filter(function (element) {
          return element !== undefined;
        });
        updateDispositions(tempDispositions);
      }}
      style={{ height: '24px' }}
    >
      <GoAContextMenuIcon type="arrow-down" title="Arrow-down" />
    </Anchor>
  );
};

export const DispositionItems: FunctionComponent<ActionComponentProps> = ({
  dispositions,
  openModalFunction,
  openDeleteModalFunction,
  updateDispositions,
  submissionRecords,
}) => {
  return (
    // eslint-disable-next-line react/jsx-no-useless-fragment
    <>
      {dispositions &&
        dispositions.map((disposition: Disposition, index) => {
          return (
            <tr key={`${disposition.name}`}>
              <td data-testid="disposition-name">{disposition.name}</td>
              <td data-testid="disposition-description">{disposition.description}</td>
              <td data-testid="disposition-order">
                <Flex>
                  {index !== 0 ? (
                    submissionRecords ? (
                      <ClickUp
                        dispositions={dispositions as Array<Disposition>}
                        index={index}
                        updateDispositions={updateDispositions}
                      />
                    ) : (
                      <GoAContextMenuIcon type="arrow-up" title="Arrow-up" />
                    )
                  ) : (
                    <EmptyBoxSpace />
                  )}
                  {index !== dispositions.length - 1 &&
                    (submissionRecords ? (
                      <ClickDown
                        dispositions={dispositions as Array<Disposition>}
                        index={index}
                        updateDispositions={updateDispositions}
                      />
                    ) : (
                      <GoAContextMenuIcon type="arrow-down" title="Arrow-down" />
                    ))}
                </Flex>
              </td>
              <td data-testid="disposition-actions">
                <RowFlex>
                  {submissionRecords ? (
                    <div>
                      <GoAContextMenuIcon
                        type="create"
                        title="Edit"
                        disabled={!submissionRecords}
                        onClick={() => openModalFunction(disposition)}
                        testId={`edit-disposition-item-${disposition.name}`}
                      />
                      <GoAContextMenuIcon
                        testId="delete-icon"
                        type="trash"
                        title="Delete"
                        disabled={!submissionRecords}
                        onClick={() => {
                          openDeleteModalFunction(disposition);
                        }}
                      />
                    </div>
                  ) : (
                    <ActionSpace />
                  )}
                </RowFlex>
              </td>
            </tr>
          );
        })}
    </>
  );
};
