import React, { FunctionComponent } from 'react';
import { Disposition } from '@store/form/model';
import { GoAContextMenuIcon } from '@components/ContextMenu';

import { RowFlex } from './style-components';
import { GoAIcon } from '@abgov/react-components-new';
import { EmptyBoxSpace, Flex } from './style-components';

interface ActionComponentProps {
  dispositions: Array<Disposition>;
  openModalFunction?: (disposition: Disposition) => void;
  openDeleteModalFunction?: (disposition: Disposition) => void;
  updateDispositions?: (dispositions: Array<Disposition>) => void;
}

export const DispositionItems: FunctionComponent<ActionComponentProps> = ({
  dispositions,
  openModalFunction,
  openDeleteModalFunction,
  updateDispositions,
}) => {
  return (
    <>
      {dispositions &&
        dispositions.map((disposition: Disposition, index) => {
          return (
            <tr key={`${disposition.name}`}>
              <td data-testid="subscription-name">{disposition.name}</td>
              <td data-testid="subscription-name">{disposition.description}</td>
              <td data-testid="subscription-name">
                <Flex>
                  {index !== 0 ? (
                    <a
                      type="secondary"
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
                    >
                      <GoAIcon type="arrow-up" />
                    </a>
                  ) : (
                    <EmptyBoxSpace />
                  )}
                  {index !== dispositions.length - 1 && (
                    <a
                      type="secondary"
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
                    >
                      <GoAIcon type="arrow-down" />
                    </a>
                  )}
                </Flex>
              </td>
              <td data-testid="subscription-name">
                <RowFlex>
                  <GoAContextMenuIcon
                    type="create"
                    title="Edit"
                    onClick={() => openModalFunction(disposition)}
                    testId={`edit-subscription-item-${disposition.name}`}
                  />

                  <GoAContextMenuIcon
                    testId="delete-icon"
                    type="trash"
                    onClick={() => {
                      openDeleteModalFunction(disposition);
                    }}
                  />
                </RowFlex>
              </td>
            </tr>
          );
        })}
    </>
  );
};
