import React, { FunctionComponent, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@store/index';
import { fetchDirectory } from '@store/directory/actions';
import { Service, defaultService } from '@store/directory/models';
import { PageIndicator } from '@components/Indicator';
import { renderNoItem } from '@components/NoItem';
import { GoAButton } from '@abgov/react-components';
import { DeleteModal } from '@components/DeleteModal';
import { DirectoryModal } from './directoryModal';
import { deleteEntry } from '@store/directory/actions';
import { ServiceTableComponent } from './serviceList';
import { toKebabName } from '@lib/kebabName';

export const DirectoryService: FunctionComponent = () => {
  const dispatch = useDispatch();
  const [isEdit, setIsEdit] = useState(false);
  const [editEntry, setEditEntry] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<Service>(defaultService);

  useEffect(() => {
    dispatch(fetchDirectory());
  }, []);

  const coreTenant = 'Platform';
  const tenantName = useSelector((state: RootState) => state.tenant?.name);
  const { directory } = useSelector((state: RootState) => state.directory);

  const indicator = useSelector((state: RootState) => {
    return state?.session?.indicator;
  });

  // eslint-disable-next-line
  useEffect(() => {}, [indicator]);
  // eslint-disable-next-line
  useEffect(() => {}, [tenantName]);

  function reset() {
    setEditEntry(false);
    setSelectedEntry(defaultService);
  }

  const onEdit = (service) => {
    setSelectedEntry(service);
    setIsEdit(true);
    setEditEntry(true);
  };
  const onDelete = (service) => {
    setShowDeleteConfirmation(true);
    setSelectedEntry(service);
  };
  return (
    <>
      {indicator.show && <PageIndicator />}
      {!indicator.show && !directory && renderNoItem('directory')}
      {!indicator.show && directory && (
        <div>
          {tenantName !== coreTenant && (
            <GoAButton
              data-testid="add-directory-btn"
              onClick={() => {
                defaultService.namespace = toKebabName(tenantName);
                setSelectedEntry(defaultService);
                setIsEdit(false);
                setEditEntry(true);
              }}
            >
              Add entry
            </GoAButton>
          )}

          <ServiceTableComponent
            namespace={tenantName}
            directory={directory}
            isCore={false}
            onEdit={onEdit}
            onDelete={onDelete}
          />

          <ServiceTableComponent
            namespace={coreTenant.toLowerCase()}
            directory={directory}
            isCore={true}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </div>
      )}
      {/* Delete confirmation */}
      {showDeleteConfirmation && (
        <DeleteModal
          isOpen={showDeleteConfirmation}
          title="Delete directory entry"
          content={`Delete ${selectedEntry?.service} ?`}
          onCancel={() => setShowDeleteConfirmation(false)}
          onDelete={() => {
            setShowDeleteConfirmation(false);
            dispatch(deleteEntry(selectedEntry));
          }}
        />
      )}
      {editEntry && (
        <DirectoryModal
          open={true}
          entry={selectedEntry}
          type={isEdit ? 'edit' : 'new'}
          onCancel={() => {
            reset();
          }}
        />
      )}
    </>
  );
};
