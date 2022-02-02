import React, { FunctionComponent, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@store/index';
import { fetchDirectory } from '@store/directory/actions';
import DataTable from '@components/DataTable';
import { Services } from '@store/directory/models';
import styled from 'styled-components';
import { PageIndicator } from '@components/Indicator';
import { renderNoItem } from '@components/NoItem';

export const DirectoryService: FunctionComponent = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchDirectory());
  }, []);

  const { directory } = useSelector((state: RootState) => state.directory);

  const nameArray = [...new Map(directory.map((item) => [item['name'], item])).values()];

  const healthEndpoint = (dir: Services) => {
    if (dir.name === 'status-service' || dir.name.startsWith('tenant-service')) {
      return dir.url;
    }
    const nameSplitter = dir.namespace.split(':');
    if (nameSplitter.length > 1) {
      const newDirectory = directory.find((item) => item.namespace === nameSplitter[0]);
      return `${newDirectory.url}/health`;
    }
    return `${dir.url}/health`;
  };

  const indicator = useSelector((state: RootState) => {
    return state?.session?.indicator;
  });

  // eslint-disable-next-line
  useEffect(() => {}, [indicator]);

  return (
    <>
      <PageIndicator />
      {!indicator.show && nameArray.length === 0 && renderNoItem('directory')}
      {!indicator.show && nameArray && (
        <div>
          {nameArray.map((item) => (
            <TableDiv key={item['name']}>
              <NameDiv>{item['name']}</NameDiv>
              <DataTable data-testid="directory-table">
                <thead data-testid="directory-table-header">
                  <tr>
                    <th id="name" data-testid="directory-table-header-name">
                      Name
                    </th>
                    <th id="directory">Health Endpoint</th>
                  </tr>
                </thead>

                <tbody key={item['name']}>
                  {directory
                    .filter((dir) => dir.name === item['name'])
                    .map((dir: Services) => {
                      return (
                        <tr key={dir.namespace}>
                          <td headers="namespace" data-testid="namespace">
                            {dir.namespace}
                          </td>
                          <td headers="directory" data-testid="directory">
                            <a href={healthEndpoint(dir)} target="_blank" rel="noopener noreferrer">
                              {healthEndpoint(dir)}
                            </a>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </DataTable>
            </TableDiv>
          ))}
        </div>
      )}
    </>
  );
};

export const NameDiv = styled.div`
  text-transform: capitalize;
  font-size: var(--fs-lg);
  font-weight: var(--fw-bold);
  padding-left: 0.4rem;
  padding-bottom: 0.5rem;
`;
export const TableDiv = styled.div`
  & td:first-child {
    width: 100px;
    white-space: nowrap;
    overflow-x: hidden;
    text-overflow: ellipsis;
  }

  & td:last-child {
    width: 40px;
    white-space: nowrap;
    overflow-x: hidden;
    text-overflow: ellipsis;
  }
`;
