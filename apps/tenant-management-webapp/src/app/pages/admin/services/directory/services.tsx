import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDirectory } from '@store/directory/actions';
import { PageIndicator } from '@components/Indicator';
import { renderNoItem } from '@components/NoItem';
import { GoAButton } from '@abgov/react-components-new';
import { DirectoryModal } from './modals/editModal';
import { ServiceTableComponent } from './serviceList';
import styled from 'styled-components';
import { DirectoryDeleteModal } from './modals/deleteModal';
import { selectDirectory } from '@store/directory/selectors';
import { selectTenantName, selectPageIndicator } from '@store/session/selectors';
import { selectSortedDirectory } from '@store/directory/selectors';
import { UpdateModalState } from '@store/session/actions';
import { AddModalType } from '@store/directory/models';

export const DirectoryService = (): JSX.Element => {
  const dispatch = useDispatch();
  const { tenantDirectory, coreDirectory } = useSelector(selectSortedDirectory);

  useEffect(() => {
    dispatch(fetchDirectory());
  }, [dispatch]);

  const coreTenant = 'Platform';
  const tenantName = useSelector(selectTenantName);
  const directory = useSelector(selectDirectory);
  const indicator = useSelector(selectPageIndicator);

  return (
    <>
      <PageIndicator />
      <DirectoryDeleteModal />
      <DirectoryModal />

      {!indicator.show && !directory && renderNoItem('directory')}
      {!indicator.show && directory && (
        <div>
          <p>Add your own entry so they can be found using the directory.</p>

          {tenantDirectory && (
            <>
              <NameDiv>{tenantName}</NameDiv>
              <GoAButton
                testId="add-directory-btn"
                onClick={() => {
                  dispatch(
                    UpdateModalState({
                      type: AddModalType,
                      id: null,
                      isOpen: true,
                    })
                  );
                }}
              >
                Add entry
              </GoAButton>

              <ServiceTableComponent headerId={`directory-tenant-table`} directory={tenantDirectory} />
            </>
          )}
          <NameDiv>{coreTenant}</NameDiv>
          <ServiceTableComponent headerId={`directory-core-table`} directory={coreDirectory} />
        </div>
      )}
    </>
  );
};
const NameDiv = styled.div`
  margin-top: 1rem;
  text-transform: capitalize;
  font-size: var(--fs-xl);
  font-weight: var(--fw-bold);
  padding-left: 0.4rem;
  padding-bottom: 0.5rem;
`;
